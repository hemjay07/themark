"use client";

import { useCallback } from "react";
import { useCountUp, useOdometerRef } from "@/lib/useCountUp";

interface PriceAxisProps {
  tokenPrice: number;
  sharePrice: number;
  fillPercent: number;
  amount: number;
  // the line the founder set; it is the right-hand end of the track
  worstFillPct: number;
}

export default function PriceAxis({
  tokenPrice,
  sharePrice,
  fillPercent,
  amount,
  worstFillPct,
}: PriceAxisProps) {

  // charter hero_technique: number-odometer. These travel to their new value.
  const limitPct = Math.max(worstFillPct, 0.01);

  // Text numbers travel without going through React state; only the bar geometry,
  // which must re-lay-out, stays on state.
  const money = useCallback((n: number) => `$${n.toFixed(2)}`, []);
  const pctFill = useCallback((n: number) => `${n.toFixed(2)}% fill`, []);
  const limitText = useCallback((n: number) => `your line ${n.toFixed(2)}%`, []);
  const tokenRef = useOdometerRef<SVGTextElement>(tokenPrice, money);
  const shareRef = useOdometerRef<SVGTextElement>(sharePrice, money);
  const fillRef = useOdometerRef<SVGTextElement>(fillPercent, pctFill);
  const limitRef = useOdometerRef<SVGTextElement>(limitPct, limitText);
  const costRef = useOdometerRef<SVGTextElement>(
    (amount * fillPercent) / 100,
    useCallback((n: number) => `$${n.toFixed(2)} on $${amount.toFixed(0)}`, [amount])
  );
  const shownFill = useCountUp(fillPercent);


  // The track is the line you set. Its left end is what you pay now, its right end is the worst
  // fill you said you would take. Everything else is drawn on that one scale, so the bar reaching
  // the end of the track IS the refusal, rather than a number quietly exceeding a threshold.
  const TRACK_START = 120;
  const TRACK_END = 900;
  const pctToSvgX = (pct: number) =>
    TRACK_START + Math.max(0, Math.min(1, pct / limitPct)) * (TRACK_END - TRACK_START);

  const tokenX = TRACK_START;
  // where the real share sits on the same scale: the basis gap, as a percentage of what you pay
  const basisPct = tokenPrice > 0 ? ((sharePrice - tokenPrice) / tokenPrice) * 100 : 0;
  const shareX = pctToSvgX(Math.abs(basisPct));

  const atLimit = fillPercent >= limitPct;
  const barEndX = pctToSvgX(fillPercent);

  // Bar is anchored to the tick you pay from; its length is the cost as a share of your line.
  const barWidth = Math.max(2, barEndX - tokenX);
  const barColor = atLimit ? "#C4261D" : "#0B7A3B";
  const captionFill = atLimit ? "#C4261D" : "#9B978D";

  // Calculate caption position
  // The caption follows the bar end but never leaves the canvas: it anchors start near the
  // left edge and end near the right, so a tiny fill does not push the text off the frame.
  const captionAnchor = barEndX < 200 ? "start" : barEndX > 800 ? "end" : "middle";
  const captionX = Math.min(980, Math.max(20, barEndX));

  return (
    <div
      data-axis="mark-axis-a"
    >
      <svg
        viewBox="0 0 1000 300"
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          animation: "axis-pop 1400ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        } as any}
      >
        <defs>
          <style>
            {`
              @keyframes axis-pop {
                0% {
                  transform: scaleY(0.8);
                  opacity: 0.7;
                  transform-origin: center;
                }
                100% {
                  transform: scaleY(1);
                  opacity: 1;
                  transform-origin: center;
                }
              }
            `}
          </style>
        </defs>

        {/* The two prices sit at fixed ends of the header so they never collide, whatever the
            basis gap does. The ticks below them carry the position. */}
        <text ref={tokenRef} x="120" y="64" textAnchor="start" fontSize="58" fill="#FAFAFA" fontFamily="JetBrains Mono" />
        <text x="120" y="106" textAnchor="start" fontSize="24" fill="#71717A" fontFamily="Archivo" letterSpacing="0.14em">
          YOU PAY
        </text>

        <text ref={shareRef} x="900" y="64" textAnchor="end" fontSize="58" fill="#FAFAFA" fontFamily="JetBrains Mono" />
        <text x="900" y="106" textAnchor="end" fontSize="24" fill="#71717A" fontFamily="Archivo" letterSpacing="0.14em">
          THE SHARE
        </text>

        {/* The track: what you pay at the left, the line you set at the right. */}
        <rect x={TRACK_START} y="168" width={TRACK_END - TRACK_START} height="54" fill="#FAFAFA" opacity="0.04" />

        {/* Baseline */}
        <line x1="0" y1="240" x2="1000" y2="240" stroke="#27272A" strokeWidth="3" />

        {/* The tick you pay from */}
        <line x1={tokenX} y1="150" x2={tokenX} y2="252" stroke="#FAFAFA" strokeWidth="4" />

        {/* Where the real share falls on this same scale */}
        <line x1={shareX} y1="158" x2={shareX} y2="248" stroke="#FAFAFA" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />

        {/* The line you set: the right end of the track */}
        <line x1={TRACK_END} y1="150" x2={TRACK_END} y2="252" stroke="#C4261D" strokeWidth="3" opacity="0.65" />
        <text ref={limitRef} x={TRACK_END} y="140" textAnchor="end" fontSize="20" fill="#C4261D" fontFamily="JetBrains Mono" opacity="0.8" />

        {/* The order: its length is the cost as a share of the line you set */}
        <rect x={tokenX + 2} y="179" width={barWidth} height="32" fill={barColor}>
        </rect>

        <text ref={fillRef} x={captionX} y="275" textAnchor={captionAnchor as any} fontSize="24" fill={captionFill} fontFamily="JetBrains Mono" />
        <text ref={costRef} x={captionX} y="296" textAnchor={captionAnchor as any} fontSize="20" fill={captionFill} fontFamily="JetBrains Mono" />
      </svg>
    </div>
  );
}
