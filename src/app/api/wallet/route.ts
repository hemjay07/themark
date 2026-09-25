import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { rpc } from "@/lib/solanaRpc";
import { jupGet } from "@/lib/jupServer";
import { TOKEN_LIST, USDC_MINT, displayName, referencePriceFor } from "@/lib/tokens";
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

// The balance multiplier from the price feed, as getQuote resolves it: the new one once it is in force.
function multiplierOf(price?: Price): number {
  const cfg = price?.scaledUiConfig;
  if (!cfg) return 1;
  const at = cfg.newMultiplierEffectiveAt ? Date.parse(cfg.newMultiplierEffectiveAt) / 1000 : null;
  if (typeof cfg.newMultiplier === "number" && at !== null && Date.now() / 1000 >= at) return cfg.newMultiplier;
  return typeof cfg.multiplier === "number" ? cfg.multiplier : 1;
}

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
  const stocks = [...moves].filter(([mint]) => LISTED.has(mint)).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  if (!stocks.length || usdc === 0) return null;
  const [mint, units] = stocks[0];
  if (usdc < 0 && units > 0) return { signature, side: "buy", mint, usd: -usdc, units, blockTime: tx.blockTime ?? null };
  if (usdc > 0 && units < 0) return { signature, side: "sell", mint, usd: usdc, units: -units, blockTime: tx.blockTime ?? null };
  return null;
}

async function tradeSignatures(owner: PublicKey): Promise<{ list: Array<[string, number | null]>; partial: boolean }> {
  const seen = new Map<string, number | null>();
  for (const t of TOKEN_LIST) {
    const [ata] = PublicKey.findProgramAddressSync(
      [owner.toBuffer(), TOKEN_2022.toBuffer(), new PublicKey(t.mint).toBuffer()],
      ATA_PROGRAM
    );
    const sigs = await rpc<Array<{ signature: string; err: unknown; blockTime?: number }>>("getSignaturesForAddress", [
      ata.toBase58(),
      { limit: 25 },
    ]);
    for (const s of sigs) if (!s.err) seen.set(s.signature, s.blockTime ?? null);
  }
  const list = [...seen].sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return { list: list.slice(0, MAX_TRADES), partial: list.length > MAX_TRADES };
}

async function holdingsOf(address: string) {
  const res = await rpc<{ value: any[] }>("getTokenAccountsByOwner", [
    address,
    { programId: TOKEN_2022.toBase58() },
    { encoding: "jsonParsed" },
  ]);
  return (res?.value ?? [])
    .map((a) => a?.account?.data?.parsed?.info)
    .filter((i) => i && LISTED.has(i.mint) && Number(i.tokenAmount?.amount) > 0)
    .map((i) => ({ mint: i.mint as string, raw: String(i.tokenAmount.amount), units: Number(i.tokenAmount.amount) / 10 ** i.tokenAmount.decimals }));
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
    const { list, partial } = await tradeSignatures(owner);
    // four reads at a time; on publicnode thirty take about two seconds
    const legs: Leg[] = [];
    let unread = 0;
    const queue = list.map(([signature]) => signature);
    const worker = async () => {
      for (let sig = queue.shift(); sig; sig = queue.shift()) {
        try {
          const tx = await rpc("getTransaction", [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
          const leg = classify(sig, tx, address);
          if (leg) legs.push(leg);
        } catch {
          // the endpoint refused this one after retries: counted, never guessed
          unread += 1;
        }
      }
    };
    const [held] = await Promise.all([holdingsOf(address), ...Array.from({ length: CONCURRENCY }, worker)]);
    legs.sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0));

    // one price read for every mint involved, through the paced queue, ahead of background work
    const mints = [...new Set([...legs.map((l) => l.mint), ...held.map((h) => h.mint)])];
    let prices: Record<string, Price> = {};
    if (mints.length) {
      const { status, body } = await jupGet(`/price/v3?ids=${mints.join(",")}`, "mid");
      if (status === 200) prices = JSON.parse(body);
    }

    const trades = legs.map((l) => {
      const p = prices[l.mint];
      const { price: ref, kind } = referencePriceFor(l.mint, p);
      const shares = l.units * multiplierOf(p);
      const value = ref === null ? null : shares * ref;
      const vsShareUsd = value === null ? null : l.side === "buy" ? l.usd - value : value - l.usd;
      return {
        signature: l.signature,
        side: l.side,
        symbol: LISTED.get(l.mint)!.symbol,
        name: displayName(LISTED.get(l.mint)!.symbol),
        usd: l.usd,
        shares,
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
      const shares = h.units * multiplierOf(p);
      const valueUsd = ref === null ? null : shares * ref;
      // the toll for getting out: what the pools pay against the token's own market price now
      const marketUsd = market === null ? null : shares * market;
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
    const valued = holdings.filter((h) => h.exitCostUsd !== null);

    return NextResponse.json(
      {
        address,
        readAt: Date.now(),
        partial,
        unread,
        trades,
        totals: { trades: trades.length, priced: priced.length, movedUsd: moved, overpaidUsd: overpaid, overpaidPct: moved > 0 ? (overpaid / moved) * 100 : null },
        holdings,
        holdingsTotals: {
          valueUsd: valued.reduce((s, h) => s + (h.valueUsd as number), 0),
          sellUsd: valued.reduce((s, h) => s + (h.sellUsd as number), 0),
          exitCostUsd: valued.reduce((s, h) => s + (h.exitCostUsd as number), 0),
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "the chain could not be read" }, { status: 502 });
  }
}
