"use client";

import Odometer from "@/components/Odometer";
import type { CellState } from "@/components/CensusRow";

interface FillBarProps {
  label: string;
  cell: CellState;
  scaleMax: number;
}

export default function FillBar({ label, cell, scaleMax }: FillBarProps) {
  const pct = cell.status === "ok" ? cell.quote.allInCostPct : 0;
  const widthPct = cell.status === "ok" ? Math.min(100, Math.max(0.6, (pct / scaleMax) * 100)) : 0;

  return (
    <div className="fb-row">
      <span className="fb-label">{label}</span>
      <span className="fb-track">
        <span className="fb-fill" style={{ width: `${widthPct}%` }} />
      </span>
      {cell.status === "ok" && (
        <span className="fb-value">
          <Odometer value={pct} decimals={2} suffix="%" />
        </span>
      )}
      {cell.status === "pending" && <span className="fb-value fb-dim">reading…</span>}
      {cell.status === "error" && <span className="fb-value fb-dim">no read</span>}
    </div>
  );
}
