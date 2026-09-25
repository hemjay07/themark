// getAccountInfo(jsonParsed) returns extensions as an array of { extension, state }.
// Verified against the live RPC for oPAiAikW... (tOpenAI) on 2026-09-22.
export interface ParsedExtension {
  extension: string;
  state: Record<string, any>;
}

// A Token-2022 extension that gives the ISSUER, not the holder, power over the holder's money.
// key is the extension name as the RPC returns it; label and meaning are plain English, read
// once from a live mint read and never guessed.
export interface IssuerControl {
  key: string;
  label: string;
  meaning: string;
}

// One leg of the route the order actually filled through, taken straight off the quote's own
// routePlan. percent is the share of the order that went through this venue.
export interface RouteLeg {
  venue: string;
  percent: number;
}

export interface Token {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  // a public company with a share price (xStocks), or a private one with only a valuation mark
  listed: boolean;
  logoURI?: string;
}

export interface Price {
  // lite-api.jup.ag/price/v3 returns usdPrice, not price. Verified against the live endpoint 2026-09-22.
  usdPrice: number;
  decimals: number;
  liquidity: number;
  scaledUiConfig?: {
    multiplier: number;
    newMultiplier?: number;
    newMultiplierEffectiveAt?: string;
    usdPricePrescaled?: number;
  };
  blockId?: number;
  priceChange24h?: number;
  createdAt?: string;
  stockData?: {
    id: string;
    price: number;
    mcap?: number;
    updatedAt?: string;
  };
}

export interface QuoteResult {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  referencePrice: number;
  onChainPrice: number;
  amountInUsd: number;
  amountOutTokens: number;
  allInCostUsd: number;
  allInCostPct: number;
  // what the route itself charges: price impact plus any transfer fee. Never negative.
  // Kept separate from allInCostPct, which nets off the basis and so can be either sign.
  fillCostPct: number;
  fillCostUsd: number;
  // what this order actually pays per unit: amount in divided by units out. Not the market mid.
  effectivePrice: number;
  // how many legs the router split this order across, from routePlan
  routeLegs: number;
  multiplier: number;
  multiplierKnown: boolean;
  liquidityUsd: number;
  // null means the mint read failed, so the fee is UNKNOWN and the cost below may be understated.
  // 0 means the mint was read and carries no fee. The two are different facts.
  transferFeePercentage: number | null;
  swapTransaction?: string; // base64
  // the untouched Jupiter quote response; /swap/v1/swap requires it verbatim
  raw: unknown;
  // the output mint's Token-2022 extensions, already read by getQuote to work out the
  // transfer fee. null means the read failed, not that the mint carries none.
  extensions: ParsedExtension[] | null;
}

export interface Receipt {
  txSignature: string;
  amountInUsdc: number;
  amountOutTokens: number;
  filledPrice: number;
  referencePrice: number;
  costAboveReference: number;
  costAboveReferencePct: number;
  savedVsWorstCase: number;
  solscanLink: string;
  timestamp: string;
  tokenSymbol: string;
  multiplier: number;
  transferFeePercentage?: number | null;
}

export interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
