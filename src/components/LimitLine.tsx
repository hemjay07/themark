"use client";

import { useMemo } from "react";

interface LimitLineProps {
  costUsd: number;
  limitPct: number;
  fillPct: number;
  amountUsd: number;
  isBlocked: boolean;
}

// The limit line as a full-width hero device. A white post at the left (what you pay),
// a bar extending right (this order's cost), and a red vertical line at the user's limit.
// When the bar crosses the limit it turns red and BLOCKED appears.
const LIMIT_AT = 0.7;

export default function LimitLine({
  costUsd,
  limitPct,
  fillPct,
  amountUsd,
  isBlocked,
}: LimitLineProps) {
  // Calculate bar width as percentage of limit. Cap at reasonable max to avoid too-wide bars.
  const barWidthPct = useMemo(() => {
    if (limitPct <= 0 || amountUsd <= 0) return 0;
    // Bar width represents the cost as a fraction of what the limit would cost
    const limitCostUsd = (limitPct / 100) * amountUsd;
    if (limitCostUsd === 0) return 0;
    // The limit sits at LIMIT_AT of the track, so an order over it visibly runs past the line
    // instead of stopping on it. The track ends at 1/LIMIT_AT of the limit.
    return Math.min(100, (costUsd / limitCostUsd) * LIMIT_AT * 100);
  }, [costUsd, limitPct, amountUsd]);

  // Limit line position (always fixed at 100% if it exists)
  const showLimit = limitPct > 0 && Number.isFinite(limitPct);

  // Determine colors
  const barColor = isBlocked ? "var(--signal)" : "var(--accept, #0B7A3B)";

  return (
    <div
      style={{
        width: "100%",
        padding: "32px 0",
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {/* The device: post + bar + limit line with BLOCKED label */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
      <div
        style={{
          position: "relative",
          height: "48px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* White post on the left (you keep) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "3px",
            height: "32px",
            background: "white",
            zIndex: 2,
          }}
        />

        {/* The track: the whole scale the bar runs along, so the post, bar and limit read as one
            instrument instead of three loose marks (PRD-V3 R3) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "3px",
            right: 0,
            height: "12px",
            background: "var(--border)",
            borderRadius: "1px",
          }}
        />

        {/* Cost bar extending right from the post */}
        <div
          style={{
            position: "absolute",
            left: "3px",
            height: "12px",
            background: barColor,
            width: `${barWidthPct}%`,
            transition: "width 320ms cubic-bezier(0.23, 1, 0.32, 1), background 320ms ease-out",
            minWidth: barWidthPct > 0 ? "2px" : "0px",
            zIndex: 1,
          }}
        />

        {/* Limit line (red vertical) at 100% if limit is set */}
        {showLimit && (
          <div
            style={{
              position: "absolute",
              left: `${LIMIT_AT * 100}%`,
              transform: "translateX(-1.5px)",
              width: "3px",
              height: "32px",
              background: "var(--signal)",
              zIndex: 3,
            }}
          />
        )}

        {/* BLOCKED label positioned from parent container */}
      </div>

      </div>

      {/* Labels (PRD-V3 R3): what the bar is, and where your limit sits */}
      <div
        style={{
          position: "relative",
          height: "28px",
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          paddingTop: "12px",
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 12, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "8px" }}>
          <span aria-hidden style={{ width: "14px", height: "6px", background: barColor, display: "inline-block" }} />
          extra this order costs
        </div>
        {showLimit && (
          <div
            style={{
              position: "absolute",
              left: `${LIMIT_AT * 100}%`,
              top: 12,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              color: "var(--signal)",
            }}
          >
            your limit {limitPct.toFixed(2)}%
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `,
      }} />
    </div>
  );
}
