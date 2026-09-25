"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/lib/useInView";
import type { Row, Gap } from "@/components/landing/Scenes";

const ORDER = 25000;
const LIMIT = 1;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// Scene 4: the field as a strip of paper stubs, one per stock, that slides across as the reader scrolls
// down. On a wide screen the scene is pinned while the strip moves; on a phone the strip scrolls
// sideways under the finger. Every stub carries the live cost of $25,000 of that stock and the stamp
// it earns against a 1% line. Movement only: the stubs are in the page from the first frame.
export default function SceneField({ rows, gaps, readAt }: { rows: Row[]; gaps: Gap[]; readAt: number | null }) {
  const { ref, inView } = useInView<HTMLElement>(0.05);
  const strip = useRef<HTMLDivElement>(null);
  const [sx, setSx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wide = matchMedia("(min-width: 761px)");
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!wide.matches || !strip.current) return setSx(0);
        const stage = innerHeight - 62;
        const top = el.getBoundingClientRect().top + scrollY;
        const travel = el.offsetHeight - stage;
        const p = Math.max(0, Math.min(1, (scrollY - top) / travel));
        const over = strip.current.scrollWidth - innerWidth + 48;
        setSx(-Math.max(0, over) * p);
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref, rows.length]);

  return (
    <section id="field" ref={ref} data-scene={4} className={`scene s-strip${inView ? " in" : ""}`}>
      <div className="strip-stage">
        <div className="scene-inner strip-head">
          <div className="kicker rv">
            <span className="kicker-n">04</span>The same order, eight prices
          </div>
          <h2 className="big rv wipe">
            Same {usd(ORDER)}.
            <br />
            <span className="dim">Very different bills.</span>
          </h2>
          <p className="body rv" style={{ ["--d" as string]: "140ms" }}>
            Every stock, the same order, read live and stamped against a 1% line. Scroll on.
            {readAt ? ` Read ${Math.max(0, Math.round((Date.now() - readAt) / 60000))} min ago, refreshed every 2.` : ""}
          </p>
        </div>
        <div className="strip-rail" data-scrolls>
          <div className="strip" ref={strip} style={{ transform: `translate3d(${sx}px,0,0)` }}>
            {rows.length === 0 && gaps.length === 0 && (
              <article className="stub-card is-wait" data-card>
                <div className="sc-k">reading</div>
                <div className="sc-name">Every stock</div>
                <div className="sc-sub">Taking the first reading: about 25 seconds.</div>
              </article>
            )}
            {rows.map((r, i) => {
              const blocked = r.pct > LIMIT;
              return (
                <article key={r.symbol} className={`stub-card${blocked ? " is-blocked" : " is-clear"}`} data-card style={{ ["--i" as string]: String(i) }}>
                  <div className="sc-k">
                    <span>{usd(ORDER)}</span>
                    <span>1% line</span>
                  </div>
                  <div className="sc-name">{r.name}</div>
                  <div className="sc-cost">{usd((r.pct / 100) * ORDER)}</div>
                  <div className="sc-sub">extra, {r.pct.toFixed(2)}% of what you spend</div>
                  <div className="sc-bar">
                    <span style={{ width: `${Math.min(100, (r.pct / Math.max(LIMIT * 2, 2.5)) * 100)}%` }} />
                    <i style={{ left: `${(LIMIT / Math.max(LIMIT * 2, 2.5)) * 100}%` }} />
                  </div>
                  <div className={`sc-stamp${blocked ? "" : " is-clear"}`}>{blocked ? "BLOCKED" : "CLEARS"}</div>
                </article>
              );
            })}
            {gaps.map((g) => (
              <article key={g.symbol} className="stub-card is-gap" data-card>
                <div className="sc-k">
                  <span>{usd(ORDER)}</span>
                  <span>1% line</span>
                </div>
                <div className="sc-name">{g.name}</div>
                <div className="sc-sub">{g.reason}</div>
              </article>
            ))}
            <a className="stub-card is-link" data-card href="/census">
              <div className="sc-k">
                <span>Compare</span>
              </div>
              <div className="sc-name">Every size, against your own line.</div>
              <div className="sc-cta">Open the field <span aria-hidden>→</span></div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
