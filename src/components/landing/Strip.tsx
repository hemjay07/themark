"use client";

import { useRef } from "react";
import { useInView } from "@/lib/useInView";
import type { Row, Gap } from "@/components/landing/Scenes";

const ORDER = 25000;
const LIMIT = 1;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// Scene 4: the field as a strip of paper stubs, one per stock, on a rail that scrolls sideways under
// the finger, the wheel or the arrows, and settles stub by stub. A pinned, scroll-driven version
// stuttered against the page's snapping (2026-09-25), so the rail is native. Every stub carries the
// live cost of $25,000 of that stock and the stamp it earns against a 1% line.
export default function SceneField({ rows, gaps, readAt }: { rows: Row[]; gaps: Gap[]; readAt: number | null }) {
  const { ref, inView } = useInView<HTMLElement>(0.2);
  const rail = useRef<HTMLDivElement>(null);
  const by = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 336, behavior: "smooth" });
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
            Every stock, the same order, read live and stamped against a 1% line.
            {readAt ? ` Read ${Math.max(0, Math.round((Date.now() - readAt) / 60000))} min ago, refreshed every 2.` : ""}
          </p>
        </div>
        <div className="strip-bar">
          <span className="strip-hint">Scroll sideways, or drag</span>
          <div className="strip-arrows">
            <button type="button" aria-label="Previous stocks" onClick={() => by(-1)}>←</button>
            <button type="button" aria-label="Next stocks" onClick={() => by(1)}>→</button>
          </div>
        </div>
        <div className="strip-rail" data-scrolls ref={rail}>
          <div className="strip">
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
