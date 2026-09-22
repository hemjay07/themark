"use client";

import PoolWell from "@/components/PoolWell";

// The same material as the instrument's ground, carried across the other surfaces so the three
// read as one product. It renders no figures: it is the product's material language, not a claim.
export default function PoolBand({ height = 200 }: { height?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        overflow: "hidden",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <PoolWell variant="band" orderShare={0.34} fillPct={0.62} limitPct={1} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(10,10,15,0.10) 0%, rgba(10,10,15,0.38) 62%, rgba(10,10,15,0.97) 100%)",
        }}
      />
    </div>
  );
}
