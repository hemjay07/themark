"use client";

import type { Token } from "@/lib/types";
import type { QuoteResult } from "@/lib/types";
import FillBar from "@/components/FillBar";
import type { SizeSpec } from "@/lib/censusSizes";

export type CellState =
  | { status: "pending" }
  | { status: "ok"; quote: QuoteResult }
  | { status: "error"; message: string };

export type RowState = Partial<Record<string, CellState>>;

interface CensusRowProps {
  rank: number | null;
  token: Token;
  row: RowState | undefined;
  sizes: SizeSpec[];
  scaleMax: number;
}

// Row position never moves: the token order on screen is fixed, so a live re-ranking of the
// field never reflows the page. Rank is read as a number printed in place, computed from the
// quotes as they land, on the row that always was there.
export default function CensusRow({ rank, token, row, sizes, scaleMax }: CensusRowProps) {
  return (
    <div className="cr">
      <div className="cr-head">
        <span className="cr-rank">{rank ? String(rank).padStart(2, "0") : "—"}</span>
        <span className="cr-symbol">{token.symbol}</span>
        <span className="cr-name">{token.name}</span>
      </div>
      <div className="cr-bars">
        {sizes.map((size) => (
          <FillBar
            key={size.key}
            label={size.label}
            cell={row?.[size.key] ?? { status: "pending" }}
            scaleMax={scaleMax}
          />
        ))}
      </div>
    </div>
  );
}
