"use client";

import { useEffect, useMemo, useState } from "react";
import { TOKEN_LIST, displayName } from "@/lib/tokens";
import { CENSUS_SIZES } from "@/lib/censusSizes";
import { useCensus } from "@/lib/useCensus";

// Compare: the field against your line (PRD-V5). Every stock at three sizes, drawn against the limit
// the reader sets. Red over the line, green under. One shared reading, refreshed every two minutes,
// its age on the page. Nothing here is computed on the client but the comparison.
export default function CensusPage() {
  const census = useCensus();
  const [limit, setLimit] = useState(1);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    const list = TOKEN_LIST.map((t) => ({
      symbol: t.symbol,
      name: displayName(t.symbol),
      cells: CENSUS_SIZES.map((s) => {
        const c = census?.cells?.[t.mint]?.[s.key];
        return { size: s, pct: c && c.ok ? c.pct : null, reason: c && !c.ok ? c.reason : null };
      }),
    }));
    // worst first, by the largest order
    return list.sort((a, b) => (b.cells[2].pct ?? -1) - (a.cells[2].pct ?? -1));
  }, [census]);

  const all = rows.flatMap((r) => r.cells.map((c) => c.pct)).filter((p): p is number => p !== null);
  const scaleMax = Math.max(limit * 1.25, ...all, 0.5);
  const line = Math.min(1, limit / scaleMax); // a fraction of the bar column
  const clears = all.filter((p) => p <= limit).length;
  const read = all.length;
  const best = rows.length && rows[rows.length - 1].cells.every((c) => c.pct !== null && c.pct <= limit) ? rows[rows.length - 1] : null;
  const worst = rows[0] ?? null;
  const worstFits = worst ? worst.cells.filter((c) => c.pct !== null && c.pct <= limit).map((c) => c.size.label) : [];
  const ageS = census?.readAt && now ? Math.max(0, Math.round((now - census.readAt) / 1000)) : null;

  return (
    <main className="fd">
      <style dangerouslySetInnerHTML={{ __html: FD_CSS }} />
      <div className="fd-inner">
        <div className="kicker">Compare stocks · the field, against your line</div>
        <h1 className="fd-sum">
            {read === 0
              ? "Taking the first reading now: about 25 seconds, then every 2 minutes."
              : `At ${limit.toFixed(2)}%, ${clears} of ${read} orders clear your line (green); the rest go over it (red). ${best ? `${best.name} clears at every size.` : ""} ${
                  worst ? (worstFits.length === 0 ? `${worst.name} clears at none.` : worstFits.length === 3 ? `${worst.name} clears at every size.` : `${worst.name} clears only at ${worstFits.join(" and ")}.`) : ""
                }`}
        </h1>
        <label className="fd-limit">
          <span>Your limit</span>
          <input data-limit type="range" min="0.1" max="3" step="0.05" value={limit} onChange={(e) => setLimit(parseFloat(e.target.value))} aria-label="Your limit" />
          <b>{limit.toFixed(2)}%</b>
        </label>

        <div className="fd-grid" style={{ ["--lf" as string]: String(line) }}>
          {read === 0 && <p className="fd-wait">Every stock at three sizes, drawn against your line, once the reading is in.</p>}
          {read > 0 && (
          <div className="fd-head" aria-hidden>
            <span />
            <span className="fd-scale">
              <em>your limit {limit.toFixed(2)}%</em>
            </span>
          </div>
          )}
          {read > 0 && rows.map((r) => (
            <div key={r.symbol} className="fd-row">
              <span className="fd-name">{r.name}</span>
              <span className="fd-track">
                {r.cells.map((c) => (
                  <span key={c.size.key} className="fd-cell">
                    <b>{c.size.label}</b>
                    <span className="fd-col">
                      <span data-cell className={`fd-bar${c.pct === null ? " gap" : c.pct > limit ? " over" : ""}${c.pct !== null && c.pct / scaleMax > 0.72 ? " in" : ""}`} style={{ width: c.pct === null ? "0%" : `${Math.max(1.5, (c.pct / scaleMax) * 100)}%` }}>
                        <i>{c.pct === null ? (c.reason ? (/no route/i.test(c.reason) ? "no exchange can fill it" : c.reason) : "…") : `${c.pct.toFixed(2)}%`}</i>
                      </span>
                    </span>
                  </span>
                ))}
                <span className="fd-line" />
              </span>
            </div>
          ))}
        </div>

        <p className="fd-age">
          {ageS !== null ? `read live ${ageS}s ago · every 2 min` : "one shared reading, refreshed every 2 minutes"} · every figure is a live quote for buying with USDC, plus the token&apos;s own fee
        </p>
      </div>
    </main>
  );
}

const FD_CSS = `
.fd{padding:40px 20px 80px}
.fd-inner{max-width:1120px;margin:0 auto}
.kicker{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-dim);margin-bottom:18px}
.fd-h{font-family:Archivo,sans-serif;font-weight:700;font-size:clamp(34px,4.6vw,64px);line-height:1;letter-spacing:-.025em;color:var(--text-primary);margin:0 0 24px}
.dim{color:var(--text-dim)}
.fd-limit{display:grid;grid-template-columns:auto minmax(160px,320px) auto;align-items:center;gap:14px;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin:18px 0 34px}
.fd-limit b{font-size:16px;color:var(--signal);letter-spacing:0}
.fd-limit input{width:100%;height:4px;appearance:none;border-radius:2px;background:var(--border);accent-color:var(--signal)}
.fd-limit input::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:50%;background:var(--signal);border:3px solid var(--bg);box-shadow:0 0 0 1.5px var(--signal);cursor:grab}
.fd-sum{font-family:Archivo,sans-serif;font-weight:600;font-size:clamp(24px,3.2vw,44px);line-height:1.12;letter-spacing:-.02em;color:var(--text-primary);margin:0;max-width:24ch;min-height:2.3em}
@media (max-width:640px){.fd-sum{min-height:4.5em}}
.fd-grid{display:grid;gap:10px;min-height:720px;align-content:start}
.fd-wait{font-family:Archivo,sans-serif;font-size:15px;color:var(--text-dim);margin:0}
.fd-head,.fd-row{display:grid;grid-template-columns:110px 1fr;gap:14px;align-items:center}
@media (max-width:640px){.fd-head,.fd-row{grid-template-columns:1fr;gap:6px}.fd-head span:first-child{display:none}}
.fd-scale{display:block;position:relative;height:16px}
.fd-scale em{position:absolute;left:calc(64px + (100% - 64px) * var(--lf, 1));transform:translateX(-50%);font-style:normal;font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--signal);white-space:nowrap}
.fd-name{font-family:Archivo,sans-serif;font-size:15px;font-weight:600;color:var(--text-primary)}
.fd-track{display:grid;gap:5px;position:relative;padding:8px 0;border-top:1px solid var(--border)}
.fd-cell{display:grid;grid-template-columns:56px 1fr;gap:8px;align-items:center}
.fd-cell b{font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:400;color:var(--text-dim);white-space:nowrap}
.fd-col{display:block;position:relative;height:16px}
.fd-bar{position:absolute;left:0;top:0;display:block;height:16px;border-radius:2px;background:#3DBE74;min-width:2px;transition:width .5s cubic-bezier(.2,.8,.2,1),background .2s ease-out}
.fd-bar.over{background:var(--signal)}
.fd-bar.gap{background:transparent}
.fd-bar i{position:absolute;left:calc(100% + 8px);top:50%;transform:translateY(-50%);font-style:normal;font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--text-primary);white-space:nowrap}
.fd-bar.gap i{color:var(--text-dim)}
.fd-bar.in i{left:auto;right:8px;color:#fff}
.fd-line{position:absolute;top:0;bottom:0;left:calc(64px + (100% - 64px) * var(--lf, 1));border-left:2px dashed rgba(196,38,29,.9);pointer-events:none}
.fd-age{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;line-height:1.7;color:var(--text-dim);margin:26px 0 0;max-width:80ch}
`;
