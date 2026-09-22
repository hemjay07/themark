"use client";

import type { CSSProperties } from "react";
import { getRoutePlan } from "@/lib/jupiter";

const microLabel: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-dim)",
};

const dimLine: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "12px",
  color: "var(--text-dim)",
  lineHeight: 1.6,
};

interface RouteBreakdownProps {
  raw: unknown;
}

// Where the money actually goes: the router's own routePlan, already returned with every
// quote and never shown until now. Each row is one exchange this order fills through, and
// the share of the order it takes.
export default function RouteBreakdown({ raw }: RouteBreakdownProps) {
  const legs = getRoutePlan(raw);

  return (
    <div>
      <div style={{ ...microLabel, marginBottom: "10px" }}>where your money actually goes</div>
      {legs === null && <div style={dimLine}>the route for this quote could not be read.</div>}
      {legs !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {legs.map((leg, i) => (
            <div
              key={`${leg.venue}-${i}`}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: "13px",
                  color: "var(--text-primary)",
                  flex: "0 0 auto",
                  minWidth: "0",
                }}
              >
                {leg.venue}
              </span>
              <span
                style={{
                  flex: 1,
                  height: "6px",
                  minWidth: "24px",
                  background: "var(--border)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${Math.min(100, Math.max(2, leg.percent))}%`,
                    background: "var(--text-dim)",
                    borderRadius: "2px",
                  }}
                />
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  fontVariantNumeric: "tabular-nums",
                  flex: "0 0 42px",
                  textAlign: "right",
                }}
              >
                {leg.percent}%
              </span>
            </div>
          ))}
          <div style={{ ...dimLine, marginTop: "2px" }}>
            {legs.length > 1
              ? `your order is split across ${legs.length} exchanges to fill it.`
              : "your order fills through this one exchange."}
          </div>
        </div>
      )}
    </div>
  );
}
