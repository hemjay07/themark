"use client";

import { useCallback } from "react";
import { useOdometerRef } from "@/lib/useCountUp";

interface OdometerProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  style?: React.CSSProperties;
}

export default function Odometer({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  durationMs = 320,
  style,
}: OdometerProps) {
  const format = useCallback(
    (n: number) =>
      `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`,
    [prefix, suffix, decimals]
  );
  const ref = useOdometerRef<HTMLSpanElement>(value, format, durationMs);
  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums", ...style }} />;
}
