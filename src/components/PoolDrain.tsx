"use client";

interface PoolDrainProps {
  amountUsd: number;
  liquidityUsd: number;
  refusing: boolean;
}

const BLOCKS = 60;

// The charter's "pool being eaten as you watch". The pool is drawn as discrete depth blocks;
// the order consumes them from the left as the amount rises. Every figure here is the live
// liquidity returned with the quote, never a stored number.
export default function PoolDrain({ amountUsd, liquidityUsd, refusing }: PoolDrainProps) {
  const share = liquidityUsd > 0 ? amountUsd / liquidityUsd : 0;
  const eaten = Math.min(BLOCKS, share * BLOCKS);
  const colour = refusing ? "#C4261D" : "#0B7A3B";

  return (
    <div data-pool-drain>
      <div
        style={{
          display: "flex",
          gap: "2px",
          height: "28px",
          alignItems: "stretch",
        }}
      >
        {Array.from({ length: BLOCKS }, (_, i) => {
          const fill = Math.max(0, Math.min(1, eaten - i));
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: "#1A1A24",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: colour,
                  transform: `scaleY(${fill})`,
                  transformOrigin: "bottom",
                  // charter: element 180ms, staggered so the pool drains left to right
                  transition: `transform 180ms cubic-bezier(0.23, 1, 0.32, 1) ${Math.min(240, i * 4)}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: "8px",
          fontSize: "11px",
          fontFamily: '"JetBrains Mono", monospace',
          color: "var(--text-dim)",
          letterSpacing: "0.04em",
          lineHeight: 1.6,
        }}
      >
        your order is {(share * 100).toFixed(2)}% of this token's $
        {Math.round(liquidityUsd).toLocaleString()} pooled liquidity
      </div>
    </div>
  );
}
