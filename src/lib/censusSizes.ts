// The three order sizes the census measures every token at. USDC has 6 decimals,
// so amountIn is the USD figure scaled by 1e6 as a base-unit string for getQuote.
export interface SizeSpec {
  key: string;
  usd: number;
  amountIn: string;
  label: string;
}

export const CENSUS_SIZES: SizeSpec[] = [
  { key: "500", usd: 500, amountIn: "500000000", label: "$500" },
  { key: "5000", usd: 5000, amountIn: "5000000000", label: "$5,000" },
  { key: "25000", usd: 25000, amountIn: "25000000000", label: "$25,000" },
];
