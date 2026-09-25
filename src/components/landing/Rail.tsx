"use client";

import { useEffect, useState } from "react";

// The dots on the right: one per scene, the current one lit. Clicking one scrolls to that scene.
export default function Rail({ ids }: { ids: string[] }) {
  const [on, setOn] = useState(0);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => e !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setOn(ids.indexOf(e.target.id));
      },
      { threshold: 0.55 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return (
    <nav className="rail" aria-label="Sections">
      {ids.map((id, i) => (
        <a key={id} href={`#${id}`} className={i === on ? "on" : ""} aria-label={`Section ${i + 1}`} aria-current={i === on ? "true" : undefined}>
          {String(i + 1).padStart(2, "0")}
        </a>
      ))}
    </nav>
  );
}
