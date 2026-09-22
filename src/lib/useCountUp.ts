"use client";

import { useEffect, useRef, useState } from "react";

// The charter's hero technique, as a hook so it works in SVG text as well as in HTML.
// A number never cuts to its new value; it travels there.
export function useCountUp(value: number, durationMs = 320, firstArrivalMs = 1400): number {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (!Number.isFinite(to) || from === to) return;

    const span = seenRef.current ? durationMs : firstArrivalMs;
    seenRef.current = true;
    const started = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / span);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setShown(next);
      fromRef.current = next;
      if (t < 1) frameRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs, firstArrivalMs]);

  return shown;
}
