"use client";

import Odometer from "@/components/Odometer";
import type { CellState } from "@/components/CensusRow";

interface FillBarProps {
  label: string;
  cell: CellState;
  scaleMax: number;
}

// The fill only ever appears once, when the live quote lands: its box size is set once, at its
// final width, so a newly-inserted element never resizes an already-painted one (charter-safe
// for CLS). Its arrival still reads as a real moment: it scales in from zero on the transform
// axis, which is a composited property the layout engine never scores as a shift.
// fillCostPct (impact + transfer fee) is the number that goes on this bar: it is never negative,
// unlike allInCostPct, which nets off basis and can read as a gain. A cost bar cannot go negative.
export default function FillBar({ label, cell, scaleMax }: FillBarProps) {
  const pct = cell.status === "ok" ? cell.quote.fillCostPct : 0;
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
      {cell.status === "error" && (
        <span className="fb-value fb-dim" title={cell.message}>
          {cell.message?.includes("rate-limit") ? "throttled" : "no read"}
        </span>
      )}
    </div>
  );
}
