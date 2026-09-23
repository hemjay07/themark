"use client";

import type { ReactNode } from "react";
import PoolWell from "@/components/PoolWell";

interface PoolHeroProps {
  orderShare: number;
  fillPct: number;
  limitPct: number;
  children: ReactNode;
}

// The pool as the page, not an object on it. The craft review's finding was that depth existed
// in exactly one 435x190 tile while every other surface was a flat panel, so the product read as
// a dark dashboard with a WebGL sticker. Here the lit surface is the ground the fold sits on.
export default function PoolHero({ orderShare, fillPct, limitPct, children }: PoolHeroProps) {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", isolation: "isolate", background: "#0A0A0F" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: "hidden" }}>
        <PoolWell variant="hero" orderShare={orderShare} fillPct={fillPct} limitPct={limitPct} />
        {/* a scrim so type stays readable over the lit surface without hiding it */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.0) 50%, rgba(10,10,15,0.4) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}>
        {children}
      </div>
    </div>
  );
}
