import type { Token } from "./types";

// Mint, symbol and decimals resolved from lite-api.jup.ag/tokens/v2/search on 2026-09-22.
// Liquidity and price are NOT stored here: they are read live per quote (charter ban 1).
export const TOKEN_LIST: Token[] = [
  // xStocks, Token-2022 with a scaled UI multiplier
  { mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", symbol: "SPYx", name: "SP500 xStock", decimals: 8 },
  { mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", symbol: "AAPLx", name: "Apple xStock", decimals: 8 },
  { mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", symbol: "TSLAx", name: "Tesla xStock", decimals: 8 },
  { mint: "XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM", symbol: "INTCx", name: "Intel xStock", decimals: 8 },
  { mint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4", symbol: "PLTRx", name: "Palantir xStock", decimals: 8 },

  // Tessera t-tokens
  { mint: "oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ", symbol: "tOpenAI", name: "T-OpenAI", decimals: 9 },
  { mint: "TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ", symbol: "tKalshi", name: "T-Kalshi", decimals: 9 },
  { mint: "TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v", symbol: "tSpaceX", name: "T-SpaceX", decimals: 9 },
];

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // verified against Jupiter token search, 2026-09-22

export function getToken(mint: string): Token | undefined {
  return TOKEN_LIST.find((t) => t.mint === mint);
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKEN_LIST.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
}

// What a person reads. Tickers like INTCx are for machines; the company name is the label, and the
// ticker sits small beneath it (founder rule: names, not hashes).
const DISPLAY: Record<string, string> = {
  SPYx: "S&P 500",
  AAPLx: "Apple",
  TSLAx: "Tesla",
  INTCx: "Intel",
  PLTRx: "Palantir",
  tOpenAI: "OpenAI",
  tKalshi: "Kalshi",
  tSpaceX: "SpaceX",
};

export function displayName(symbol: string): string {
  return DISPLAY[symbol] ?? symbol;
}
