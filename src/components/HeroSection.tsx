"use client";

import { TOKEN_LIST } from "@/lib/tokens";

import Odometer from "@/components/Odometer";
import LimitLine from "@/components/LimitLine";

interface HeroSectionProps {
  costUsd: number;
  costPct: number;
  limitPct: number;
  fillPct: number;
  amountUsd: number;
  isBlocked: boolean;
  selectedStock: string;
  hasQuote: boolean;
}

// The fold's hero object: the dollar cost as the largest thing on the page,
// with the limit line as the device that shows what your order costs vs your guard.
export default function HeroSection({
  costUsd,
  costPct,
  limitPct,
  fillPct,
  amountUsd,
  isBlocked,
  selectedStock,
  hasQuote,
}: HeroSectionProps) {
  // The company, in words, not the ticker: "Intel xStock" -> "Intel", "T-OpenAI" -> "OpenAI".
  const cleanName = (TOKEN_LIST.find((t) => t.symbol === selectedStock)?.name ?? selectedStock)
    .replace(/ xStock$/, "")
    .replace(/^T-/, "")
    .replace(/^SP500$/, "the S&P 500");

  return (
    <div
      style={{
        width: "100%",
        padding: "48px 24px 32px",
        textAlign: "center",
      }}
    >
      {/* Small caption headline */}
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "12px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          marginBottom: "24px",
        }}
      >
        what this order costs you
      </div>

      {/* The huge cost number - the largest thing on the page */}
      <div
        style={{
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: "clamp(64px, 12vw, 160px)",
            lineHeight: 1,
            // one line reserved: the live figure is written to the DOM a frame after it mounts,
            // and an empty line box for that frame shifted everything under it by 172px
            minHeight: "1em",
            letterSpacing: "-0.02em",
            color: isBlocked ? "var(--signal)" : "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
            fontWeight: "600",
          }}
        >
          {hasQuote ? <Odometer value={costUsd} prefix="$" durationMs={320} /> : "$—"}
        </div>
      </div>

      {/* One-line explanation: "extra on your $X of TokenName" */}
      <div
        style={{
          fontFamily: '"Archivo", sans-serif',
          fontSize: "clamp(14px, 2vw, 18px)",
          color: "var(--text-muted)",
          marginBottom: "32px",
          lineHeight: 1.4,
          letterSpacing: "-0.01em",
        }}
      >
        {hasQuote
          ? `extra on your $${Math.round(amountUsd).toLocaleString()} of ${cleanName}`
          : "reading the pool right now"}
      </div>

      {/* The limit line as the full-width hero device */}
      <div
        style={{
          maxWidth: "100%",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        <LimitLine
          costUsd={costUsd}
          limitPct={limitPct}
          fillPct={fillPct}
          amountUsd={amountUsd}
          isBlocked={isBlocked}
        />
      </div>
    </div>
  );
}
