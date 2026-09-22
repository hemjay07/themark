export interface Token {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  liquidity: number;
  logoURI?: string;
}

export interface Price {
  id: string;
  type: string;
  price: number;
  decimals: number;
  symbol: string;
  stockData?: {
    price: number;
    symbol: string;
    name: string;
  };
  liquidity: number;
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
  transferFeePercentage?: number;
  swapTransaction?: string; // base64
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
