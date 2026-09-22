import { USDC_MINT, getToken } from "./tokens";
import { fetchPrices } from "./jupiter";

// A single token account's balance move for one owner across a transaction, read straight off
// preTokenBalances/postTokenBalances. Decimals and uiAmount both come from the balance entry
// itself; nothing here is hardcoded (charter ban 1).
export interface TxBalanceChange {
  mint: string;
  decimals: number;
  delta: number;
}

export interface TxReconciliation {
  signature: string;
  signer: string;
  usdcSpent: number;
  tokenReceived: number;
  tokenMint: string;
  tokenSymbol: string;
  effectivePrice: number;
  referencePrice: number;
  fillCostUsd: number;
  fillCostPct: number;
  feeSol: number;
  blockTime: number | null;
  slot: number;
}

// Reads the transaction through this app's own route, because the public RPC refuses
// browser-origin requests with 403.
export async function fetchTransaction(signature: string): Promise<any> {
  const res = await fetch(`/api/tx?signature=${encodeURIComponent(signature)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `the transaction could not be read (${res.status})`);
  }
  return data.transaction;
}

function signerPubkey(tx: any): string | null {
  const keys = tx?.transaction?.message?.accountKeys;
  if (!Array.isArray(keys)) return null;
  const signer = keys.find((k: any) => k?.signer === true);
  return signer?.pubkey ?? keys[0]?.pubkey ?? null;
}

// Every token-account balance change for one owner, keyed by account index so a newly created
// associated token account (present only in postTokenBalances) still counts as a move from 0.
function balanceChanges(tx: any, owner: string): TxBalanceChange[] {
  const pre = tx?.meta?.preTokenBalances ?? [];
  const post = tx?.meta?.postTokenBalances ?? [];
  const indices = new Set<number>([
    ...pre.map((b: any) => b.accountIndex),
    ...post.map((b: any) => b.accountIndex),
  ]);

  const rows: TxBalanceChange[] = [];
  for (const idx of indices) {
    const preB = pre.find((b: any) => b.accountIndex === idx);
    const postB = post.find((b: any) => b.accountIndex === idx);
    const rowOwner = postB?.owner ?? preB?.owner;
    if (rowOwner !== owner) continue;

    const mint = postB?.mint ?? preB?.mint;
    const decimals = postB?.uiTokenAmount?.decimals ?? preB?.uiTokenAmount?.decimals;
    if (typeof mint !== "string" || typeof decimals !== "number") continue;

    const preAmt = preB?.uiTokenAmount?.uiAmount ?? 0;
    const postAmt = postB?.uiTokenAmount?.uiAmount ?? 0;
    rows.push({ mint, decimals, delta: postAmt - preAmt });
  }
  return rows;
}

// Decodes what actually moved for the signer and reconciles it against a live reference price.
// Refuses rather than guessing at any step: a transaction that is not a USDC-in, token-out swap,
// or a mint with no live price, produces an error instead of a number.
export async function reconcileTransaction(signature: string): Promise<TxReconciliation> {
  const tx = await fetchTransaction(signature);
  const signer = signerPubkey(tx);
  if (!signer) throw new Error("could not identify a signer in this transaction");

  const changes = balanceChanges(tx, signer);
  const spent = changes.find((c) => c.mint === USDC_MINT && c.delta < 0);
  const received = changes.find((c) => c.mint !== USDC_MINT && c.delta > 0);
  if (!spent || !received) {
    throw new Error("this signature has no USDC-in, token-out swap for its signer");
  }

  const usdcSpent = Math.abs(spent.delta);
  const tokenReceived = received.delta;
  if (usdcSpent <= 0 || tokenReceived <= 0) {
    throw new Error("the balance change on this signature is zero; nothing to reconcile");
  }
  const effectivePrice = usdcSpent / tokenReceived;

  const prices = await fetchPrices([received.mint]);
  const price = prices[received.mint];
  const referencePrice = price?.stockData?.price ?? price?.usdPrice;
  if (!Number.isFinite(referencePrice)) {
    throw new Error("no live reference price for this mint right now; refusing to reconcile");
  }

  const fillCostUsd = usdcSpent - tokenReceived * (referencePrice as number);
  const fillCostPct = (fillCostUsd / usdcSpent) * 100;
  const feeSol = (tx?.meta?.fee ?? 0) / 1e9;
  const token = getToken(received.mint);

  return {
    signature,
    signer,
    usdcSpent,
    tokenReceived,
    tokenMint: received.mint,
    tokenSymbol: token?.symbol ?? `${received.mint.slice(0, 4)}…`,
    effectivePrice,
    referencePrice: referencePrice as number,
    fillCostUsd,
    fillCostPct,
    feeSol,
    blockTime: tx?.blockTime ?? null,
    slot: tx?.slot ?? 0,
  };
}
