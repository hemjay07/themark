import type { Token } from "./types";

// Verified mints from spike/SPIKE.md, MEASURED-2026-09-22.md
// Token-2022 format with extensions (scaledUiAmountConfig, transferFeeConfig)
// Note: These are verified by the spike tests on 2026-09-22
export const TOKEN_LIST: Token[] = [
  // xStocks (deep to thin)
  {
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    symbol: "SPYx",
    name: "SPY Index",
    decimals: 6,
    liquidity: 8000000,
  },
  {
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    symbol: "AAPLx",
    name: "Apple (has multiplier 1.00326901)",
    decimals: 6,
    liquidity: 760000,
  },
  {
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    symbol: "TSLAx",
    name: "Tesla",
    decimals: 6,
    liquidity: 1560000,
  },
  {
    mint: "XsoPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM",
    symbol: "INTCx",
    name: "Intel (thin book)",
    decimals: 6,
    liquidity: 112000,
  },
  {
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    symbol: "PLTRx",
    name: "Palantir (thin book, 1.41% price impact on $500)",
    decimals: 6,
    liquidity: 270000,
  },

  // Tessera t-tokens (hardcoded from PLAN.md)
  {
    mint: "oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ",
    symbol: "tOpenAI",
    name: "Tessera OpenAI (has 20 bps transfer fee)",
    decimals: 6,
    liquidity: 500000,
  },
  {
    mint: "TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ",
    symbol: "tKalshi",
    name: "Tessera Kalshi",
    decimals: 6,
    liquidity: 300000,
  },
  {
    mint: "SpaceX9qb4TJ8r8qkPqMKzFhFNvE2SLZzXS6vDBKqc8q",
    symbol: "tSpaceX",
    name: "Tessera SpaceX",
    decimals: 6,
    liquidity: 200000,
  },
];

export const USDC_MINT = "EPjFWdd5Au17Burns64kndyvfjkAnLCNkDA3ghQuf";

export function getToken(mint: string): Token | undefined {
  return TOKEN_LIST.find((t) => t.mint === mint);
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKEN_LIST.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
}
