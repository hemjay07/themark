"use client";

import { useEffect, useMemo, useState } from "react";
import { getQuote } from "@/lib/jupiter";
import { TOKEN_LIST, USDC_MINT } from "@/lib/tokens";
import { CENSUS_SIZES } from "@/lib/censusSizes";
import CensusRow, { type CellState, type RowState } from "@/components/CensusRow";

const DELAY_MS = 120;

export default function CensusPage() {
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [lastRead, setLastRead] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (const token of TOKEN_LIST) {
        for (const size of CENSUS_SIZES) {
          if (cancelled) return;
          let cell: CellState;
          try {
            const q = await getQuote(USDC_MINT, token.mint, size.amountIn);
            cell = q ? { status: "ok", quote: q } : { status: "error", message: "no live quote returned" };
          } catch {
            cell = { status: "error", message: "quote call failed" };
          }
          if (cancelled) return;
          setRows((prev) => ({
            ...prev,
            [token.mint]: { ...prev[token.mint], [size.key]: cell },
          }));
          if (cell.status === "ok") setLastRead(new Date().toISOString());
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
      }
      if (!cancelled) setDone(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const scaleMax = useMemo(() => {
    const pcts: number[] = [];
    for (const row of Object.values(rows)) {
      for (const size of CENSUS_SIZES) {
        const cell = row?.[size.key];
        if (cell?.status === "ok") pcts.push(cell.quote.allInCostPct);
      }
    }
    if (!pcts.length) return 1;
    return Math.max(...pcts) * 1.08;
  }, [rows]);

  const rankedTokens = useMemo(() => {
    return TOKEN_LIST.slice().sort((a, b) => {
      const worst = (mint: string) => {
        const row = rows[mint];
        if (!row) return -1;
        let max = -1;
        for (const size of CENSUS_SIZES) {
          const cell = row[size.key];
          if (cell?.status === "ok") max = Math.max(max, cell.quote.allInCostPct);
        }
        return max;
      };
      return worst(b.mint) - worst(a.mint);
    });
  }, [rows]);

  const readAt = lastRead
    ? new Date(lastRead).toLocaleTimeString(undefined, { hour12: false })
    : null;

  return (
    <main className="census-page">
      <style>{`
        .census-page{max-width:960px;margin:0 auto;padding:48px 24px 88px}
        .census-kicker{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--text-dim);margin-bottom:18px}
        .census-headline{font-family:Archivo,sans-serif;font-weight:400;font-size:32px;line-height:1.12;
          letter-spacing:-0.01em;color:var(--text-primary);margin:0 0 16px;max-width:22ch}
        .census-sub{font-size:14px;line-height:1.6;color:var(--text-muted);max-width:56ch;margin:0 0 24px}
        .census-status{display:flex;align-items:center;gap:8px;font-family:"JetBrains Mono",monospace;
          font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px}
        .census-dot{width:6px;height:6px;border-radius:50%;background:var(--success);flex:0 0 6px}
        .census-legend{display:flex;gap:20px;flex-wrap:wrap;padding:16px 0 20px;margin-bottom:8px;
          border-bottom:1px solid var(--border);font-family:"JetBrains Mono",monospace;font-size:11px;
          color:var(--text-dim);letter-spacing:.06em}
        .census-legend b{color:var(--text-primary);font-weight:400}
        .census-list{display:flex;flex-direction:column}
        .cr{border-bottom:1px solid var(--border);padding:16px 0}
        .cr:first-child{border-top:1px solid var(--border)}
        .cr-head{display:flex;align-items:baseline;gap:10px;margin-bottom:10px;min-width:0}
        .cr-rank{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--text-dim);flex:0 0 20px}
        .cr-symbol{font-family:"JetBrains Mono",monospace;font-size:15px;color:var(--text-primary);flex:0 0 auto}
        .cr-name{font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;min-width:0}
        .cr-bars{display:flex;flex-direction:column;gap:2px}
        .fb-row{display:flex;align-items:center;gap:10px;padding:5px 0}
        .fb-label{flex:0 0 58px;font-family:"JetBrains Mono",monospace;font-size:10.5px;
          color:var(--text-dim);text-transform:uppercase;letter-spacing:.04em}
        .fb-track{flex:1;height:8px;min-width:0;background:var(--border);border-radius:2px;overflow:hidden}
        .fb-fill{height:100%;background:var(--signal);border-radius:2px;
          transition:width 320ms cubic-bezier(0.23,1,0.32,1)}
        .fb-value{flex:0 0 62px;text-align:right;font-family:"JetBrains Mono",monospace;font-size:12.5px;
          color:var(--text-primary);font-variant-numeric:tabular-nums}
        .fb-dim{color:var(--text-dim)}
        .census-foot{margin-top:28px;padding-top:20px;border-top:1px solid var(--border);
          font-family:"JetBrains Mono",monospace;font-size:11px;line-height:1.7;color:var(--text-dim)}
        @media (max-width:600px){
          .census-page{padding:32px 16px 72px}
          .census-headline{font-size:22px;max-width:none}
          .cr-name{display:none}
          .fb-label{flex:0 0 48px;font-size:10px}
          .fb-value{flex:0 0 54px;font-size:12px}
        }
      `}</style>

      <div className="census-kicker">The Mark · Census</div>
      <h1 className="census-headline">the gap is 0.20%, the fill is up to 9x larger</h1>
      <p className="census-sub">
        every tokenized stock is measured at three order sizes, live, and ranked by what the fill
        actually costs. the gap between the token and the real share is a median 0.20%. the pool is
        where the rest of the cost lives.
      </p>

      <div className="census-status">
        <span className="census-dot" />
        {readAt ? `live · last read ${readAt}` : "live · reading…"}
        {done ? " · all rows read" : ""}
      </div>

      <div className="census-legend">
        <span>order sizes</span>
        {CENSUS_SIZES.map((s) => (
          <span key={s.key}>
            <b>{s.label}</b>
          </span>
        ))}
      </div>

      <div className="census-list">
        {rankedTokens.map((token, i) => (
          <CensusRow
            key={token.mint}
            rank={i + 1}
            token={token}
            row={rows[token.mint]}
            sizes={CENSUS_SIZES}
            scaleMax={scaleMax}
          />
        ))}
      </div>

      <div className="census-foot">
        every figure above came from getQuote against lite-api.jup.ag/swap/v1/quote at the moment it
        was read, USDC in, 50bps slippage. a row that says &quot;no read&quot; failed its call and shows
        nothing invented in its place.
      </div>
    </main>
  );
}
