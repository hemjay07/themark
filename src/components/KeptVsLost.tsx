"use client";

import type { CSSProperties } from "react";
import Odometer from "@/components/Odometer";

const microLabel: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-dim)",
};

interface KeptVsLostProps {
  amountInUsd: number;
  costUsd: number;
}

// The same cost, said in dollars a stranger can feel: of what you put in, this much becomes
// shares and this much is gone in costs. Both figures come off the live quote already on
// screen; nothing here is a new call.
export default function KeptVsLost({ amountInUsd, costUsd }: KeptVsLostProps) {
  const kept = Math.max(0, amountInUsd - costUsd);
  const lostPct = amountInUsd > 0 ? Math.min(100, Math.max(0, (costUsd / amountInUsd) * 100)) : 0;

  return (
    <div>
      <div style={{ ...microLabel, marginBottom: "10px" }}>
        of your ${amountInUsd.toFixed(0)}
      </div>
      <div
        style={{
          display: "flex",
          height: "10px",
          borderRadius: "3px",
          overflow: "hidden",
          background: "var(--border)",
          marginBottom: "12px",
        }}
      >
        <span style={{ display: "block", height: "100%", width: `${100 - lostPct}%`, background: "var(--success)" }} />
        <span style={{ display: "block", height: "100%", width: `${lostPct}%`, background: "var(--signal)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <div style={{ ...microLabel, color: "var(--success)", marginBottom: "4px" }}>you keep, in shares</div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "clamp(20px, 4vw, 26px)",
              color: "var(--success)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Odometer value={kept} prefix="$" />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...microLabel, color: "var(--signal)", marginBottom: "4px" }}>goes to costs</div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "clamp(20px, 4vw, 26px)",
              color: "var(--signal)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Odometer value={costUsd} prefix="$" />
          </div>
        </div>
      </div>
    </div>
  );
}
