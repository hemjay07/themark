import type { Price, QuoteResult } from "./types";
import { USDC_MINT, getToken } from "./tokens";

const JUPITER_BASE_URL = "https://lite-api.jup.ag";
const JUPITER_QUOTE_URL = "https://lite-api.jup.ag/swap/v1"; // quote-api.jup.ag does not resolve; verified 2026-09-22

// getAccountInfo(jsonParsed) returns extensions as an array of { extension, state }.
// Verified against the live RPC for oPAiAikW... (tOpenAI) on 2026-09-22.
export interface ParsedExtension {
  extension: string;
  state: Record<string, any>;
}

// Reads the mint's Token-2022 extensions through this app's own route, because the public
// RPC refuses browser-origin requests with 403.
export async function getMintExtensions(mint: string): Promise<ParsedExtension[]> {
  try {
    const res = await fetch(`/api/mint?mint=${encodeURIComponent(mint)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.extensions) ? data.extensions : [];
  } catch (err) {
    console.error("Failed to fetch mint extensions:", err);
    return [];
  }
}

// The scaled UI multiplier from the mint account, which is the authority for it.
// Returns null when the mint carries no scaledUiAmountConfig at all.
export function getMultiplier(extensions: ParsedExtension[]): number | null {
  const cfg = extensions.find((e) => e.extension === "scaledUiAmountConfig");
  const raw = cfg?.state?.multiplier;
  if (raw === undefined || raw === null) return null;
  const value = typeof raw === "number" ? raw : parseFloat(String(raw));
  return Number.isFinite(value) ? value : null;
}

// Transfer fee in percent, from the newer fee schedule. Returns 0 when the mint has no fee.
export function getTransferFeePercentage(extensions: ParsedExtension[]): number {
  const cfg = extensions.find((e) => e.extension === "transferFeeConfig");
  const bps = cfg?.state?.newerTransferFee?.transferFeeBasisPoints;
  return typeof bps === "number" ? bps / 100 : 0;
}

// Jupiter's public endpoint rate-limits. A 429 is not an answer, so the call is retried with
// backoff rather than being treated as "no data"; a number is still only ever shown when a call
// in this moment returned it.
async function fetchWithRetry(url: string, tries = 3): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (res.ok) return res;
      if (res.status !== 429 && res.status < 500) return null;
    } catch {
      // network error: fall through to the backoff
    }
    await new Promise((r) => setTimeout(r, 350 * Math.pow(2, i)));
  }
  return null;
}

export async function fetchPrices(mints: string[]): Promise<Record<string, Price>> {
  const params = new URLSearchParams();
  mints.forEach((m) => params.append("ids", m));

  try {
    const res = await fetchWithRetry(`${JUPITER_BASE_URL}/price/v3?${params}`);
    if (!res) {
      console.warn("Jupiter price unavailable after retries");
      return {};
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Jupiter price fetch failed:", err);
    return {};
  }
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amountIn: string,
  slippageBps: number = 50
): Promise<QuoteResult | null> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amountIn,
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: "false",
    asLegacyTransaction: "false",
  });

  try {
    const res = await fetchWithRetry(`${JUPITER_QUOTE_URL}/quote?${params}`);
    if (!res) {
      console.error("Quote unavailable after retries");
      return null;
    }

    const quoteData = await res.json();

    // Fetch prices to get reference price
    const prices = await fetchPrices([outputMint]);
    const price = prices[outputMint];

    if (!price) {
      console.error("Could not fetch price for reference");
      return null;
    }

    // The multiplier comes from the price response itself; the transfer fee needs the mint account.
    const extensions = await getMintExtensions(outputMint);
    const transferFeePercentage = getTransferFeePercentage(extensions);
    const onChainMultiplier = getMultiplier(extensions);
    const feedMultiplier = price.scaledUiConfig?.multiplier;
    const resolvedMultiplier =
      onChainMultiplier ?? (typeof feedMultiplier === "number" ? feedMultiplier : null);
    const multiplierKnown = resolvedMultiplier !== null;
    const multiplier = resolvedMultiplier ?? 1;

    // usdPrice is the on-chain token price; stockData.price is the real share it references.
    const referencePrice = price.stockData?.price ?? price.usdPrice;
    const onChainPrice = price.usdPrice;
    if (!Number.isFinite(referencePrice) || !Number.isFinite(onChainPrice)) {
      // charter ban 1: a number that was not returned by this call does not go on the surface.
      console.error("Price read returned no usable number; refusing to quote.");
      return null;
    }
    // Decimals come from the live mint data first; the local list is only a fallback.
    const decimals = price.decimals ?? getToken(outputMint)?.decimals;
    if (typeof decimals !== "number") {
      console.error("No decimals for mint; refusing to quote.");
      return null;
    }

    // Raw token amount from quote
    const amountOutRaw = parseInt(quoteData.outAmount);

    // Apply multiplier to get UI amount (amount user sees in wallet)
    const amountOutTokens = (amountOutRaw / Math.pow(10, decimals)) * multiplier;

    const amountInUsd = parseInt(amountIn) / Math.pow(10, 6); // USDC = 6 decimals
    const shareValueUsd = amountOutTokens * referencePrice;

    // All-in cost: what user pays minus what they get (in USD terms)
    let allInCostUsd = amountInUsd - shareValueUsd;

    // Add transfer fee to all-in cost if present
    if (transferFeePercentage > 0) {
      const transferFeeAmount = (amountInUsd * transferFeePercentage) / 100;
      allInCostUsd += transferFeeAmount;
    }

    const allInCostPct = (allInCostUsd / amountInUsd) * 100;

    // Jupiter returns priceImpactPct as a FRACTION. Verified 2026-09-22 against PLTRx: a $500
    // order quotes 0.00465 and a $25,000 order 0.01689, a delta of 1.22 points, and the effective
    // price moves $184.45 -> $186.75, which is 1.25%. So the field is a fraction, not a percent.
    const impactPct = Math.abs(Number(quoteData.priceImpactPct) || 0) * 100;
    const fillCostPct = impactPct + transferFeePercentage;
    const fillCostUsd = (amountInUsd * fillCostPct) / 100;

    return {
      inputMint,
      outputMint,
      inAmount: amountIn,
      outAmount: quoteData.outAmount,
      priceImpactPct: quoteData.priceImpactPct || 0,
      referencePrice,
      onChainPrice,
      amountInUsd,
      amountOutTokens,
      allInCostUsd,
      allInCostPct,
      fillCostPct,
      fillCostUsd,
      multiplier,
      multiplierKnown,
      liquidityUsd: price.liquidity,
      raw: quoteData,
      transferFeePercentage: transferFeePercentage > 0 ? transferFeePercentage : undefined,
    };
  } catch (err) {
    console.error("Quote fetch failed:", err);
    return null;
  }
}

export async function getSwapTransaction(
  quoteResult: any,
  walletPublicKey: string
): Promise<string | null> {
  try {
    const res = await fetch(`${JUPITER_QUOTE_URL}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quoteResult,
        userPublicKey: walletPublicKey,
        wrapAndUnwrapSol: true,
      }),
    });

    if (!res.ok) {
      console.error(`Swap transaction creation failed: ${res.status}`);
      return null;
    }

    const { swapTransaction } = await res.json();
    return swapTransaction; // base64-encoded tx
  } catch (err) {
    console.error("Swap transaction fetch failed:", err);
    return null;
  }
}
