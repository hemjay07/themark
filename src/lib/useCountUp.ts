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

    // Under reduced motion the number arrives at its value immediately: the content must never
    // depend on an animation the reader has switched off.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(to);
      fromRef.current = to;
      seenRef.current = true;
      return;
    }

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

/**
 * The same travel, but written straight to the DOM instead of through React state.
 * A number tweening at 60fps through setState re-renders its whole subtree every frame;
 * during page load that was the most expensive thing on the surface. This keeps the
 * motion and takes React out of the loop.
 */
export function useOdometerRef<T extends Element>(
  value: number,
  format: (n: number) => string,
  durationMs = 320,
  firstArrivalMs = 1400
) {
  const elRef = useRef<T | null>(null);
  const fromRef = useRef(0);
  const seenRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || !Number.isFinite(value)) return;

    const from = fromRef.current;
    const to = value;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (from === to || reduced) {
      el.textContent = format(to);
      fromRef.current = to;
      seenRef.current = true;
      return;
    }

    const span = seenRef.current ? durationMs : firstArrivalMs;
    seenRef.current = true;
    const started = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / span);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      el.textContent = format(next);
      fromRef.current = next;
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, format, durationMs, firstArrivalMs]);

  return elRef;
}
