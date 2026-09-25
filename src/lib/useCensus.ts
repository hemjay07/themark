"use client";

import { useEffect, useState } from "react";

export type CensusCell = { ok: true; pct: number } | { ok: false; reason: string };
export type Census = { readAt: number | null; complete: boolean; cells: Record<string, Record<string, CensusCell>> };

// The one shared reading of every stock at three sizes (src/app/api/census). Polls until the first
// reading is complete, then every two minutes, the cadence the reading itself refreshes on.
export function useCensus(): Census | null {
  const [census, setCensus] = useState<Census | null>(null);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const ctl = new AbortController();
    const read = async () => {
      try {
        const res = await fetch("/api/census", { cache: "no-store", signal: ctl.signal });
        const data = res.ok ? ((await res.json()) as Census) : null;
        if (!cancelled && data) setCensus(data);
        timer = setTimeout(read, data?.complete ? 120_000 : 8_000);
      } catch {
        if (!cancelled) timer = setTimeout(read, 8_000);
      }
    };
    read();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      ctl.abort();
    };
  }, []);
  return census;
}
