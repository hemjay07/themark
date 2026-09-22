"use client";

import { useState, useEffect } from "react";

interface PriceAxisProps {
  tokenPrice: number;
  sharePrice: number;
  fillPercent: number;
  amount: number;
}

export default function PriceAxis({
  tokenPrice,
  sharePrice,
  fillPercent,
  amount,
}: PriceAxisProps) {
  const [key, setKey] = useState(0);

  // Trigger animation on mount and when prices change
  useEffect(() => {
    setKey((k) => k + 1);
  }, [tokenPrice, sharePrice]);

  // Calculate SVG positions
  // Linear mapping: token at 12%, share at 78%
  const priceRange = sharePrice - tokenPrice;
  const priceToSvgX = (price: number) => {
    const percent = 12 + ((price - tokenPrice) / priceRange) * 66;
    return percent * 10; // Convert to SVG units (1000 width)
  };

  const tokenX = priceToSvgX(tokenPrice);
  const shareX = priceToSvgX(sharePrice);

  // Calculate where the order lands (bar end)
  const fillInPrice = sharePrice * (fillPercent / 100);
  const barEndPrice = tokenPrice + fillInPrice;
  // When the gap between the two prices is pennies, a fill of a fraction of a percent lands
  // far outside the drawn range, so the bar is clamped to the canvas rather than running off it.
  const barEndX = Math.min(960, priceToSvgX(barEndPrice));

  // Bar is anchored to token tick, width is the distance to bar end
  const barWidth = Math.max(2, barEndX - tokenX);
  const barColor = barEndPrice >= sharePrice ? "#C4261D" : "#0B7A3B";
  const captionFill = barEndPrice >= sharePrice ? "#C4261D" : "#9B978D";

  // Calculate caption position
  const captionX = Math.min(960, Math.max(60, barEndX));
  const captionAnchor = barEndX > 900 ? "end" : "middle";

  return (
    <div
      key={key}
      data-device="mark-axis-a"
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

        {/* Token price label */}
        <text
          x={tokenX}
          y="64"
          textAnchor="middle"
          fontSize="62"
          fill="#FAFAFA"
          fontFamily="JetBrains Mono"
        >
          ${tokenPrice.toFixed(2)}
        </text>
        <text
          x={tokenX}
          y="106"
          textAnchor="middle"
          fontSize="25"
          fill="#71717A"
          fontFamily="Archivo"
          letterSpacing="0.14em"
        >
          YOU PAY
        </text>

        {/* Share price label */}
        <text
          x={shareX}
          y="64"
          textAnchor="middle"
          fontSize="62"
          fill="#FAFAFA"
          fontFamily="JetBrains Mono"
        >
          ${sharePrice.toFixed(2)}
        </text>
        <text
          x={shareX}
          y="106"
          textAnchor="middle"
          fontSize="25"
          fill="#71717A"
          fontFamily="Archivo"
          letterSpacing="0.14em"
        >
          THE SHARE
        </text>

        {/* Gap fill */}
        <rect
          x={tokenX + 2}
          y="150"
          width={shareX - tokenX - 4}
          height="90"
          fill="#FAFAFA"
          opacity="0.05"
        />

        {/* Baseline */}
        <line x1="0" y1="240" x2="1000" y2="240" stroke="#27272A" strokeWidth="3" />

        {/* Ticks */}
        <line
          x1={tokenX}
          y1="140"
          x2={tokenX}
          y2="250"
          stroke="#FAFAFA"
          strokeWidth="4"
        />
        <line
          x1={shareX}
          y1="140"
          x2={shareX}
          y2="250"
          stroke="#FAFAFA"
          strokeWidth="4"
        />

        {/* Order bar - anchored to token tick */}
        <rect
          x={tokenX + 2}
          y="179"
          width={barWidth}
          height="32"
          fill={barColor}
        />

        {/* Bar label - split into two lines to avoid clipping */}
        <text
          x={captionX}
          y="275"
          textAnchor={captionAnchor as any}
          fontSize="24"
          fill={captionFill}
          fontFamily="JetBrains Mono"
        >
          {fillPercent.toFixed(2)}% fill
        </text>
        <text
          x={captionX}
          y="296"
          textAnchor={captionAnchor as any}
          fontSize="20"
          fill={captionFill}
          fontFamily="JetBrains Mono"
        >
          ${((amount * fillPercent) / 100).toFixed(2)} on ${amount.toFixed(0)}
        </text>
      </svg>
    </div>
  );
}
