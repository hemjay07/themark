"use client";

import Odometer from "@/components/Odometer";
import type { CellState } from "@/components/CensusRow";

interface FillBarProps {
  label: string;
  cell: CellState;
  scaleMax: number;
}

// The fill only ever appears once, when the live quote lands: it is never present with a
// width of 0 and then grown, because a growing box on an already-painted element is a layout
// shift, and a page whose own subject is honesty about cost should not fake stability either.
// It fades in (opacity only, no box-size change) so its arrival still reads as a motion moment.
export default function FillBar({ label, cell, scaleMax }: FillBarProps) {
  const pct = cell.status === "ok" ? cell.quote.allInCostPct : 0;
  const widthPct = cell.status === "ok" ? Math.min(100, Math.max(0.6, (pct / scaleMax) * 100)) : 0;

  return (
    <div className="fb-row">
      <span className="fb-label">{label}</span>
      <span className="fb-track">
        {cell.status === "ok" && <span className="fb-fill" style={{ width: `${widthPct}%` }} />}
      </span>
      {cell.status === "ok" && (
        <span className="fb-value fb-in">
          <Odometer value={pct} decimals={2} suffix="%" />
        </span>
      )}
      {cell.status === "pending" && <span className="fb-value fb-dim">reading…</span>}
      {cell.status === "error" && <span className="fb-value fb-dim">no read</span>}
    </div>
  );
}
