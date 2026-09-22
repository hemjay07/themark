"use client";

import { useCountUp } from "@/lib/useCountUp";

interface OdometerProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  style?: React.CSSProperties;
}

export default function Odometer({ value, decimals = 2, prefix = "", suffix = "", durationMs = 320, style }: OdometerProps) {
  const shown = useCountUp(value, durationMs);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}
