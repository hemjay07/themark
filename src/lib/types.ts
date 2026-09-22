export interface Token {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
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
  multiplier: number;
  multiplierKnown: boolean;
  liquidityUsd: number;
  transferFeePercentage?: number;
  swapTransaction?: string; // base64
  // the untouched Jupiter quote response; /swap/v1/swap requires it verbatim
  raw: unknown;
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
  transferFeePercentage?: number;
}

export interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
