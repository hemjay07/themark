"use client";

import type { ReactNode } from "react";
import { useInView } from "@/lib/useInView";

// One full-screen scene of the story. It snaps into place, and everything marked .rv inside it plays
// its entrance once, the first time the scene is in view (PRD-V4 motion rules).
export default function Scene({
  id,
  index,
  kicker,
  className = "",
  children,
}: {
  id: string;
  index: number;
  kicker?: string;
  className?: string;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLElement>(0.3);
  return (
    <section id={id} ref={ref} data-scene={index} className={`scene ${className}${inView ? " in" : ""}`}>
      <div className="scene-inner">
        {kicker && (
          <div className="kicker rv">
            <span className="kicker-n">{String(index).padStart(2, "0")}</span>
            {kicker}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
