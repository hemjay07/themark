"use client";

import { displayName } from "@/lib/tokens";
import Odometer from "@/components/Odometer";
import LimitLine from "@/components/LimitLine";

interface HeroSectionProps {
  costUsd: number;
  limitPct: number;
  fillPct: number;
  amountUsd: number;
  isBlocked: boolean;
  noRoute: boolean;
  selectedStock: string;
  hasQuote: boolean;
  // the quote failed (not just pending): say so instead of "reading"
  failed?: boolean;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// The first screen: one sentence saying what THE MARK is (PRD-V3 R1), then the dollar cost of this
// order as the largest thing on the page, then the labelled limit line.
export default function HeroSection({
  costUsd,
  limitPct,
  fillPct,
  amountUsd,
  isBlocked,
  noRoute,
  selectedStock,
  hasQuote,
  failed,
}: HeroSectionProps) {
  const name = displayName(selectedStock);

  return (
    <div data-hero style={{ width: "100%" }}>
      {/* the name's second meaning, used once, as the claim (founder rule: a repeatable phrase with a
          second meaning). A mark is a measurement line, and the person a con is run on. */}
      <h1
        style={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 600,
          fontSize: "clamp(34px, 4.2vw, 56px)",
          lineHeight: 1.02,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          margin: "0 0 14px",
        }}
      >
        Don&apos;t be the mark.
      </h1>
      <p
        style={{
          fontFamily: "Archivo, sans-serif",
          fontSize: "clamp(17px, 1.6vw, 20px)",
          lineHeight: 1.45,
          color: "var(--text-muted)",
          margin: "0 0 32px",
          maxWidth: "46ch",
        }}
      >
        THE MARK shows what a tokenized stock really costs you before you buy it on Solana, and stops the
        trade if that cost is more than you allow.
      </p>

      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "12px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          marginBottom: "22px",
        }}
      >
        what this order costs you
      </div>

      <div
        style={{
          fontFamily: noRoute ? "Archivo, sans-serif" : '"JetBrains Mono", monospace',
          fontSize: noRoute ? "clamp(30px, 3.4vw, 48px)" : "clamp(64px, 9vw, 136px)",
          lineHeight: 1,
          // one line reserved: the live figure is written a frame after it mounts
          minHeight: "1em",
          letterSpacing: "-0.02em",
          color: isBlocked ? "var(--signal)" : "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
          marginBottom: "14px",
        }}
      >
        {noRoute ? "No exchange can fill it" : hasQuote ? <Odometer value={costUsd} prefix="$" durationMs={320} /> : "$—"}
      </div>

      <div
        style={{
          fontFamily: "Archivo, sans-serif",
          fontSize: "clamp(15px, 1.4vw, 18px)",
          color: "var(--text-muted)",
          marginBottom: "36px",
          lineHeight: 1.45,
        }}
      >
        {noRoute
          ? `No exchange on Solana can fill ${usd(amountUsd)} of ${name} right now.`
          : hasQuote
            ? `extra on your ${usd(amountUsd)} of ${name}`
            : failed ? "no live price right now" : "reading the market right now"}
      </div>

      <LimitLine
        costUsd={noRoute ? 0 : costUsd}
        limitPct={limitPct}
        fillPct={fillPct}
        amountUsd={amountUsd}
        isBlocked={isBlocked}
      />
    </div>
  );
}
