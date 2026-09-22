import type { IssuerControl, ParsedExtension, Price, QuoteResult, RouteLeg } from "./types";
import { USDC_MINT, getToken } from "./tokens";

export type { ParsedExtension } from "./types";


// Reads the mint's Token-2022 extensions through this app's own route, because the public
// RPC refuses browser-origin requests with 403.
// Returns null when the read FAILED, and an array when it succeeded. The two are different
// facts: an empty array means the mint carries no extensions, null means nobody knows.
// Collapsing both to [] let the surface print "no transfer fee" about a call that never answered.
export async function getMintExtensions(mint: string): Promise<ParsedExtension[] | null> {
  try {
    const res = await fetch(`/api/mint?mint=${encodeURIComponent(mint)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.extensions) ? data.extensions : null;
  } catch (err) {
    console.error("Failed to fetch mint extensions:", err);
    return null;
  }
}

// The scaled UI multiplier from the mint account, which is the authority for it.
// A scaledUiAmountConfig carries TWO multipliers: the current one and a newMultiplier that takes
// effect at newMultiplierEffectiveTimestamp. Once that timestamp has passed the new one IS the
// live multiplier and the old field is stale. Verified on SPYx 2026-09-22: the timestamp
// (1781755200) passed three months ago, and Jupiter's own usdPricePrescaled / usdPrice equals
// newMultiplier (1.005714560286254) exactly, not multiplier (1.003909240011759).
// Reading the stale field manufactured ~0.18% of cost on a $500 order out of nothing.
export function getMultiplier(extensions: ParsedExtension[] | null, nowSeconds = Date.now() / 1000): number | null {
  if (!extensions) return null;
  const cfg = extensions.find((e) => e.extension === "scaledUiAmountConfig");
  if (!cfg?.state) return null;

  const num = (raw: unknown): number | null => {
    if (raw === undefined || raw === null) return null;
    const v = typeof raw === "number" ? raw : parseFloat(String(raw));
    return Number.isFinite(v) ? v : null;
  };

  const current = num(cfg.state.multiplier);
  const next = num(cfg.state.newMultiplier);
  const effectiveAt = num(cfg.state.newMultiplierEffectiveTimestamp);

  if (next !== null && effectiveAt !== null && nowSeconds >= effectiveAt) return next;
  return current;
}

// Transfer fee in percent, from the newer fee schedule. Returns 0 when the mint has no fee.
export function getTransferFeePercentage(extensions: ParsedExtension[] | null): number | null {
  if (!extensions) return null;
  const cfg = extensions.find((e) => e.extension === "transferFeeConfig");
  const bps = cfg?.state?.newerTransferFee?.transferFeeBasisPoints;
  return typeof bps === "number" ? bps / 100 : 0;
}

// The Token-2022 extensions that hand the ISSUER power over a holder's money, not the holder.
// Each entry names the RPC's extension key, a short label, and what it means in plain English
// for the person's money — never the extension name itself (indexer vocabulary is not a label).
// Presence of the extension IS the fact worth showing; a holder cannot tell any of this from the
// price feed or from holding the token.
const ISSUER_CONTROL_DEFS: Array<{ key: string; label: string; meaning: string }> = [
  {
    key: "permanentDelegate",
    label: "the issuer can move your tokens",
    meaning: "a permanent delegate is set on this mint, so the issuer can move or seize your tokens out of your wallet without asking you.",
  },
  {
    key: "pausableConfig",
    label: "the issuer can halt trading",
    meaning: "trading in this token can be paused by the issuer at any time, for everyone, with no warning to you.",
  },
  {
    key: "transferHook",
    label: "custom code runs on every transfer",
    meaning: "code the issuer controls runs every time this token moves, and it can block or alter the transfer.",
  },
  {
    key: "confidentialTransferMint",
    label: "transfer amounts can be hidden",
    meaning: "this mint supports hiding transfer amounts, so what actually moved is not always visible on-chain.",
  },
];

// defaultAccountState is only a real risk to a holder when new accounts start FROZEN; a mint
// that defaults to initialized carries the extension but grants the issuer nothing extra here.
// The RPC's jsonParsed state has been seen as either a lowercase string or a numeric enum
// (Token-2022: 0 uninitialized, 1 initialized, 2 frozen), so both are read.
function defaultAccountStartsFrozen(state: Record<string, any> | undefined): boolean {
  if (!state) return false;
  const raw = state.accountState ?? state.state;
  if (typeof raw === "string") return raw.toLowerCase() === "frozen";
  if (typeof raw === "number") return raw === 2;
  return false;
}

// Reads which of the issuer-power extensions are actually present on this mint, right now.
// Returns null when the read failed — a failed read must never be shown as "no risks found"
// (charter ban 1). Returns [] when the read succeeded and genuinely found none.
export function getIssuerControls(extensions: ParsedExtension[] | null): IssuerControl[] | null {
  if (!extensions) return null;
  const found: IssuerControl[] = [];
  for (const def of ISSUER_CONTROL_DEFS) {
    if (extensions.some((e) => e.extension === def.key)) {
      found.push(def);
    }
  }
  const defaultState = extensions.find((e) => e.extension === "defaultAccountState");
  if (defaultState && defaultAccountStartsFrozen(defaultState.state)) {
    found.push({
      key: "defaultAccountState",
      label: "new accounts start frozen",
      meaning: "a wallet that has never held this token starts frozen and the issuer must thaw it before you can use what you receive.",
    });
  }
  return found;
}

// The route the order actually fills through, off the quote's own routePlan — already fetched
// for every quote and never shown. Returns null when the raw quote carries no readable plan.
export function getRoutePlan(raw: unknown): RouteLeg[] | null {
  const plan = (raw as any)?.routePlan;
  if (!Array.isArray(plan) || plan.length === 0) return null;
  const legs: RouteLeg[] = [];
  for (const step of plan) {
    const venue = step?.swapInfo?.label;
    const percent = step?.percent;
    if (typeof venue === "string" && Number.isFinite(percent)) {
      legs.push({ venue, percent });
    }
  }
  return legs.length > 0 ? legs : null;
}

// Jupiter's public endpoint rate-limits. A 429 is not an answer, so the call is retried with
// backoff rather than being treated as "no data"; a number is still only ever shown when a call
// in this moment returned it.
// When the public endpoint throttles us, the surface must say THAT rather than "no read",
// which reads as a broken product. This records the moment it last happened so the UI can
// name the real reason. It stores a timestamp, never a price.
let lastRateLimitedAt = 0;
export function rateLimitedRecently(withinMs = 20000): boolean {
  return lastRateLimitedAt > 0 && Date.now() - lastRateLimitedAt < withinMs;
}

async function fetchWithRetry(url: string, tries = 3): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (res.ok) return res;
      if (res.status === 429) lastRateLimitedAt = Date.now();
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
    // through this app's own queue, never straight from the browser (see src/app/api/jup/route.ts)
    const res = await fetchWithRetry(`/api/jup?path=/price/v3&${params}`);
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

// Pre-fetched reads shared across several quotes for the same mint. The census asks for three
// order sizes per token and was refetching that token's price and mint extensions for each one,
// so eight tokens cost 72 HTTP calls and rate-limited us into "no read" across the whole page.
export interface QuoteContext {
  price?: Price;
  extensions?: ParsedExtension[] | null;
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amountIn: string,
  slippageBps: number = 50,
  ctx?: QuoteContext
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
    const res = await fetchWithRetry(`/api/jup?path=/swap/v1/quote&${params}`);
    if (!res) {
      console.error("Quote unavailable after retries");
      return null;
    }

    const quoteData = await res.json();

    // Fetch prices to get reference price, unless the caller already read it this pass
    let price = ctx?.price;
    if (!price) {
      const prices = await fetchPrices([outputMint]);
      price = prices[outputMint];
    }

    if (!price) {
      console.error("Could not fetch price for reference");
      return null;
    }

    // The multiplier comes from the price response itself; the transfer fee needs the mint account.
    const extensions =
      ctx && Object.prototype.hasOwnProperty.call(ctx, "extensions")
        ? ctx.extensions ?? null
        : await getMintExtensions(outputMint);
    // A mint read that fails must not silently drop a real 20 bps out of the cost, but it must
    // not kill the quote either: the public RPC rate-limits constantly, and refusing every quote
    // made the product unusable and printed "no read" across the whole census. The fee is carried
    // as unknown instead, and the surface says so.
    const transferFeePercentage = getTransferFeePercentage(extensions);
    const onChainMultiplier = getMultiplier(extensions);
    const feedCfg = price.scaledUiConfig;
    const feedEffectiveAt = feedCfg?.newMultiplierEffectiveAt
      ? Date.parse(feedCfg.newMultiplierEffectiveAt) / 1000
      : null;
    const feedMultiplier =
      feedCfg && typeof feedCfg.newMultiplier === "number" &&
      feedEffectiveAt !== null && Date.now() / 1000 >= feedEffectiveAt
        ? feedCfg.newMultiplier
        : feedCfg?.multiplier;
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
    if (transferFeePercentage !== null && transferFeePercentage > 0) {
      const transferFeeAmount = (amountInUsd * transferFeePercentage) / 100;
      allInCostUsd += transferFeeAmount;
    }

    const allInCostPct = (allInCostUsd / amountInUsd) * 100;

    // Jupiter returns priceImpactPct as a FRACTION. Verified 2026-09-22 against PLTRx: a $500
    // order quotes 0.00465 and a $25,000 order 0.01689, a delta of 1.22 points, and the effective
    // price moves $184.45 -> $186.75, which is 1.25%. So the field is a fraction, not a percent.
    const rawImpact = Number(quoteData.priceImpactPct);
    if (!Number.isFinite(rawImpact)) {
      // A fill cost of 0.00% would drive the refusal gate to accept and flatten the device.
      // A guess is worse than no guard. (charter ban 1)
      console.error("Quote carried no usable price impact; refusing to quote.");
      return null;
    }
    const impactPct = Math.abs(rawImpact) * 100;
    const fillCostPct = impactPct + (transferFeePercentage ?? 0);
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
      effectivePrice: amountOutTokens > 0 ? amountInUsd / amountOutTokens : 0,
      routeLegs: Array.isArray(quoteData.routePlan) ? quoteData.routePlan.length : 0,
      multiplier,
      multiplierKnown,
      liquidityUsd: price.liquidity,
      raw: quoteData,
      transferFeePercentage,
      extensions,
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
    const res = await fetch(`/api/jup?path=/swap/v1/swap`, {
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
