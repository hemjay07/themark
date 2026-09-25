import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { rpc } from "@/lib/solanaRpc";
import { jupGet } from "@/lib/jupServer";
import { TOKEN_LIST, USDC_MINT, displayName, referencePriceFor, multiplierFromFeed } from "@/lib/tokens";
import type { Price } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Were you the mark?" Every tokenized-stock trade a wallet ever made, read off the chain and priced
// against the real share, then what it holds now and what selling it all today would cost. Nothing is
// stored: each scan reads the chain and the market at request time.
//
// Every listed stock is a Token-2022 mint, so the wallet's account for each one is its associated
// token account under that program. Asking for that account's signatures returns exactly the trades
// that touched the stock, instead of every transaction the wallet ever signed.
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const MAX_TRADES = 30;
const CONCURRENCY = 4;
const LISTED = new Map(TOKEN_LIST.map((t) => [t.mint, t]));

type Leg = { signature: string; side: "buy" | "sell"; mint: string; usd: number; units: number; blockTime: number | null };

function marketPriceOf(price?: Price): number | null {
  const p = price?.usdPrice;
  return typeof p === "number" && Number.isFinite(p) ? p : null;
}

// Raw base units moved for one owner, per mint, off pre/post token balances. Raw, not uiAmount, so a
// scaled-balance token cannot be counted with its multiplier applied twice.
function rawMoves(tx: any, owner: string): Map<string, number> {
  const pre = tx?.meta?.preTokenBalances ?? [];
  const post = tx?.meta?.postTokenBalances ?? [];
  const byIndex = new Map<number, { mint: string; decimals: number; pre: number; post: number }>();
  for (const b of pre) {
    if (b.owner !== owner) continue;
    byIndex.set(b.accountIndex, { mint: b.mint, decimals: b.uiTokenAmount.decimals, pre: Number(b.uiTokenAmount.amount), post: 0 });
  }
  for (const b of post) {
    if (b.owner !== owner) continue;
    const row = byIndex.get(b.accountIndex) ?? { mint: b.mint, decimals: b.uiTokenAmount.decimals, pre: 0, post: 0 };
    row.post = Number(b.uiTokenAmount.amount);
    byIndex.set(b.accountIndex, row);
  }
  const moves = new Map<string, number>();
  for (const r of byIndex.values()) {
    moves.set(r.mint, (moves.get(r.mint) ?? 0) + (r.post - r.pre) / 10 ** r.decimals);
  }
  return moves;
}

function classify(signature: string, tx: any, owner: string): Leg | null {
  if (!tx || tx.meta?.err) return null;
  const moves = rawMoves(tx, owner);
  const usdc = moves.get(USDC_MINT) ?? 0;
  const stocks = [...moves].filter(([mint, units]) => LISTED.has(mint) && Math.abs(units) > 0);
  // exactly one listed stock against USDC is a purchase or a sale; a basket or a stock-to-stock swap
  // cannot be priced as one trade, so it is left out rather than misread
  if (stocks.length !== 1 || Math.abs(usdc) < 0.01) return null;
  const [mint, units] = stocks[0];
  if (usdc < 0 && units > 0) return { signature, side: "buy", mint, usd: -usdc, units, blockTime: tx.blockTime ?? null };
  if (usdc > 0 && units < 0) return { signature, side: "sell", mint, usd: usdc, units: -units, blockTime: tx.blockTime ?? null };
  return null;
}

// Every token account the wallet holds for a listed stock (the associated one and any other), with
// what is in it. One call. The accounts are where the trades happened, so their histories are the
// trades, and their balances are the holdings.
type Account = { address: string; mint: string; raw: bigint; decimals: number };
async function accountsOf(owner: PublicKey): Promise<Account[]> {
  const res = await rpc<{ value: any[] }>("getTokenAccountsByOwner", [
    owner.toBase58(),
    { programId: TOKEN_2022.toBase58() },
    { encoding: "jsonParsed" },
  ]);
  const found = (res?.value ?? [])
    .map((a) => ({ address: a?.pubkey as string, info: a?.account?.data?.parsed?.info }))
    .filter((a) => a.address && a.info && LISTED.has(a.info.mint))
    .map((a) => ({ address: a.address, mint: a.info.mint as string, raw: BigInt(a.info.tokenAmount.amount), decimals: a.info.tokenAmount.decimals as number }));
  // a closed associated account still has a history: derive it too, once, if it is not in the list
  for (const t of TOKEN_LIST) {
    const [ata] = PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_2022.toBuffer(), new PublicKey(t.mint).toBuffer()], ATA_PROGRAM);
    if (!found.some((f) => f.address === ata.toBase58())) found.push({ address: ata.toBase58(), mint: t.mint, raw: 0n, decimals: t.decimals });
  }
  return found;
}

async function tradeSignatures(accounts: Account[]): Promise<{ list: Array<[string, number | null]>; partial: boolean }> {
  const seen = new Map<string, number | null>();
  let partial = false;
  for (const a of accounts) {
    const sigs = await rpc<Array<{ signature: string; err: unknown; blockTime?: number }>>("getSignaturesForAddress", [a.address, { limit: 25 }]);
    if (sigs.length >= 25) partial = true;
    for (const s of sigs) if (!s.err) seen.set(s.signature, s.blockTime ?? null);
  }
  const list = [...seen].sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return { list: list.slice(0, MAX_TRADES), partial: partial || list.length > MAX_TRADES };
}

// holdings summed by mint across accounts, so one stock is one row and one exit quote
function holdingsFrom(accounts: Account[]) {
  const byMint = new Map<string, { raw: bigint; decimals: number }>();
  for (const a of accounts) {
    if (a.raw <= 0n) continue;
    const cur = byMint.get(a.mint) ?? { raw: 0n, decimals: a.decimals };
    byMint.set(a.mint, { raw: cur.raw + a.raw, decimals: a.decimals });
  }
  return [...byMint].map(([mint, v]) => ({ mint, raw: v.raw.toString(), units: Number(v.raw) / 10 ** v.decimals }));
}

export async function GET(request: Request) {
  const address = (new URL(request.url).searchParams.get("address") ?? "").trim();
  let owner: PublicKey;
  try {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) throw new Error("bad");
    owner = new PublicKey(address);
  } catch {
    return NextResponse.json({ error: "that is not a Solana wallet address" }, { status: 400 });
  }

  try {
    const accounts = await accountsOf(owner);
    const { list, partial } = await tradeSignatures(accounts);
    // four reads at a time; on publicnode thirty take about two seconds
    const legs: Leg[] = [];
    let unread = 0;
    const queue = list.map(([signature]) => signature);
    const worker = async () => {
      for (let sig = queue.shift(); sig; sig = queue.shift()) {
        try {
          const tx = await rpc("getTransaction", [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 1 }]);
          if (!tx) {
            unread += 1;
            continue;
          }
          const leg = classify(sig, tx, address);
          if (leg) legs.push(leg);
        } catch {
          // the endpoint refused this one: counted, never guessed
          unread += 1;
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    const held = holdingsFrom(accounts);
    legs.sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0));

    // one price read for every mint involved, through the paced queue, ahead of background work
    const mints = [...new Set([...legs.map((l) => l.mint), ...held.map((h) => h.mint)])];
    let prices: Record<string, Price> = {};
    let pricesRead = true;
    if (mints.length) {
      const { status, body } = await jupGet(`/price/v3?ids=${mints.join(",")}`, "mid");
      if (status === 200) prices = JSON.parse(body);
      else pricesRead = false;
    }

    const trades = legs.map((l) => {
      const p = prices[l.mint];
      const { price: ref, kind } = referencePriceFor(l.mint, p);
      const mult = multiplierFromFeed(p);
      const shares = mult === null ? null : l.units * mult;
      const value = ref === null || shares === null ? null : shares * ref;
      const vsShareUsd = value === null ? null : l.side === "buy" ? l.usd - value : value - l.usd;
      return {
        signature: l.signature,
        side: l.side,
        symbol: LISTED.get(l.mint)!.symbol,
        name: displayName(LISTED.get(l.mint)!.symbol),
        usd: l.usd,
        shares: shares ?? l.units,
        sharesKnown: shares !== null,
        vsShareUsd,
        vsSharePct: vsShareUsd === null ? null : (vsShareUsd / l.usd) * 100,
        referenceKind: kind,
        blockTime: l.blockTime,
      };
    });
    const priced = trades.filter((t) => t.vsShareUsd !== null);
    const moved = priced.reduce((s, t) => s + t.usd, 0);
    const overpaid = priced.reduce((s, t) => s + (t.vsShareUsd as number), 0);

    const holdings = [];
    for (const h of held) {
      const p = prices[h.mint];
      const { price: ref, kind } = referencePriceFor(h.mint, p);
      const market = marketPriceOf(p);
      const mult = multiplierFromFeed(p);
      const shares = mult === null ? h.units : h.units * mult;
      const valueUsd = ref === null || mult === null ? null : shares * ref;
      // the toll for getting out: what the pools pay against the token's own market price now
      const marketUsd = market === null || mult === null ? null : shares * market;
      const q = await jupGet(`/swap/v1/quote?inputMint=${h.mint}&outputMint=${USDC_MINT}&amount=${h.raw}&slippageBps=100`, "mid");
      let sellUsd: number | null = null;
      try {
        if (q.status === 200) sellUsd = Number(JSON.parse(q.body).outAmount) / 1e6;
      } catch {
        sellUsd = null;
      }
      holdings.push({
        symbol: LISTED.get(h.mint)!.symbol,
        name: displayName(LISTED.get(h.mint)!.symbol),
        shares,
        valueUsd,
        referenceKind: kind,
        sellUsd,
        exitCostUsd: marketUsd !== null && sellUsd !== null ? marketUsd - sellUsd : null,
      });
    }
    // totals only when every holding could be valued; a partial sum under rows showing "—" is a lie
    const whole = holdings.length > 0 && holdings.every((h) => h.exitCostUsd !== null);

    return NextResponse.json(
      {
        address,
        readAt: Date.now(),
        partial,
        unread,
        pricesRead,
        trades,
        totals: { trades: trades.length, priced: priced.length, movedUsd: moved, overpaidUsd: overpaid, overpaidPct: moved > 0 ? (overpaid / moved) * 100 : null },
        holdings,
        holdingsTotals: whole
          ? {
              valueUsd: holdings.reduce((s, h) => s + (h.valueUsd as number), 0),
              sellUsd: holdings.reduce((s, h) => s + (h.sellUsd as number), 0),
              exitCostUsd: holdings.reduce((s, h) => s + (h.exitCostUsd as number), 0),
            }
          : null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "the chain could not be read" }, { status: 502 });
  }
}
