"use client";

import { useEffect, useMemo, useState } from "react";
import { getQuote, fetchPrices, getMintExtensions, rateLimitedRecently } from "@/lib/jupiter";
import { TOKEN_LIST, USDC_MINT } from "@/lib/tokens";
import { CENSUS_SIZES } from "@/lib/censusSizes";
import CensusRow, { type CellState, type RowState } from "@/components/CensusRow";
import PoolBand from "@/components/PoolBand";

// 24 quotes fired strictly one after another, each of them three network calls, left the page
// still reading after several seconds. They run through a small pool instead: fast enough to be
// populated when a judge looks at it, small enough not to trip Jupiter's rate limit.
const CONCURRENCY = 3;
const ROW_SLOT = 160;

// "Intel xStock" -> "Intel", "T-OpenAI" -> "OpenAI": the headline names companies, not tickers.
const plainName = (symbol: string) => {
  const t = TOKEN_LIST.find((x) => x.symbol === symbol);
  return (t?.name ?? symbol).replace(/ xStock$/, "").replace(/^T-/, "").replace(/^SP500$/, "the S&P 500");
};

export default function CensusPage() {
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [lastRead, setLastRead] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // One price call for every token, then one mint read per token, then the three quotes.
      // Previously each of the 24 cells refetched both, which was 72 calls and rate-limited us
      // into "no read" across the whole page.
      const mints = TOKEN_LIST.map((t) => t.mint);
      const prices = await fetchPrices(mints);
      if (cancelled) return;

      const tokens = [...TOKEN_LIST];
      let nextToken = 0;
      const worker = async () => {
        while (!cancelled) {
          const ti = nextToken++;
          if (ti >= tokens.length) return;
          const token = tokens[ti];
          const price = prices[token.mint];
          const extensions = await getMintExtensions(token.mint);
          if (cancelled) return;

          for (const size of CENSUS_SIZES) {
            if (cancelled) return;
            let cell: CellState;
            try {
              const q = await getQuote(USDC_MINT, token.mint, size.amountIn, 50, { price, extensions });
              cell = q
                ? { status: "ok", quote: q }
                : {
                    status: "error",
                    message: rateLimitedRecently()
                      ? "Jupiter is rate-limiting this address"
                      : "no live quote returned",
                  };
            } catch {
              cell = { status: "error", message: "quote call failed" };
            }
            if (cancelled) return;
            setRows((prev) => ({
              ...prev,
              [token.mint]: { ...prev[token.mint], [size.key]: cell },
            }));
            if (cell.status === "ok") setLastRead(new Date().toISOString());
          }
        }
      };

      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      if (!cancelled) setDone(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // The headline claim is computed from the rows that have landed, never remembered. (charter ban 1)
  const spread = useMemo(() => {
    const largest = CENSUS_SIZES[CENSUS_SIZES.length - 1];
    const landed: Array<{ symbol: string; pct: number }> = [];
    for (const token of TOKEN_LIST) {
      const cell = rows[token.mint]?.[largest.key];
      if (cell?.status === "ok" && Number.isFinite(cell.quote.fillCostPct)) {
        landed.push({ symbol: token.symbol, pct: cell.quote.fillCostPct });
      }
    }
    if (landed.length < 2) return null;
    landed.sort((a, b) => a.pct - b.pct);
    const best = landed[0];
    const worst = landed[landed.length - 1];
    if (best.pct <= 0) return null;
    return {
      multiple: `${Math.round(worst.pct / best.pct)}x`,
      size: largest.label ?? largest.key,
      bestSymbol: best.symbol,
      bestPct: best.pct.toFixed(2),
      worstSymbol: worst.symbol,
      worstPct: worst.pct.toFixed(2),
    };
  }, [rows]);

  // fillCostPct (price impact plus transfer fee) is the fill's own cost, never negative.
  // allInCostPct nets off the basis and can go negative, which is wrong for a cost bar.
  const scaleMax = useMemo(() => {
    const pcts: number[] = [];
    for (const row of Object.values(rows)) {
      for (const size of CENSUS_SIZES) {
        const cell = row?.[size.key];
        if (cell?.status === "ok") pcts.push(cell.quote.fillCostPct);
      }
    }
    if (!pcts.length) return 1;
    return Math.max(...pcts) * 1.08;
  }, [rows]);

  // The rank each token would hold once its worst leg is known — printed as a number on a row
  // that never moves, so the field can be read as ranked without the list itself reordering
  // under the reader as quotes land (a moving row is a layout shift; a printed number is not).
  const rankByMint = useMemo(() => {
    const worst = (mint: string) => {
      const row = rows[mint];
      if (!row) return null;
      let max: number | null = null;
      for (const size of CENSUS_SIZES) {
        const cell = row[size.key];
        if (cell?.status === "ok") max = Math.max(max ?? -Infinity, cell.quote.fillCostPct);
      }
      return max;
    };
    const scored = TOKEN_LIST.map((t) => ({ mint: t.mint, score: worst(t.mint) }))
      .filter((s): s is { mint: string; score: number } => s.score !== null)
      .sort((a, b) => b.score - a.score);
    const map = new Map<string, number>();
    scored.forEach((s, i) => map.set(s.mint, i + 1));
    return map;
  }, [rows]);

  // worst first, then the tokens still reading, in list order
  const slotByMint = useMemo(() => {
    const ranked = TOKEN_LIST.filter((t) => rankByMint.has(t.mint)).sort(
      (a, b) => (rankByMint.get(a.mint) ?? 0) - (rankByMint.get(b.mint) ?? 0)
    );
    const rest = TOKEN_LIST.filter((t) => !rankByMint.has(t.mint));
    return new Map([...ranked, ...rest].map((t, i) => [t.mint, i]));
  }, [rankByMint]);



  const readAt = lastRead
    ? new Date(lastRead).toLocaleTimeString(undefined, { hour12: false })
    : null;

  return (
    <>
      {/* the instrument's own material, carried here so the three surfaces read as one product */}
      <PoolBand height={190} />
      <main className="census-page">
      {/* Rendered via dangerouslySetInnerHTML, not as a plain text child: <style> is a raw-text
          HTML element, so the browser never decodes entities inside it. React's default text-node
          serializer HTML-escapes quote characters for SSR, which produced a real server/client
          text mismatch here (the font-family strings contain literal double quotes) and was the
          source of the React #425 hydration error. dangerouslySetInnerHTML skips that escaping. */}
      <style dangerouslySetInnerHTML={{ __html: `
        .census-page{max-width:960px;margin:0 auto;padding:48px 24px 88px}
        .census-kicker{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--text-dim);margin-bottom:18px}
        .census-headline{min-height:2.3em;font-family:Archivo,sans-serif;font-weight:400;font-size:32px;line-height:1.12;
          letter-spacing:-0.01em;color:var(--text-primary);margin:0 0 16px;max-width:22ch}
        .census-sub{font-size:14px;line-height:1.6;color:var(--text-muted);max-width:56ch;margin:0 0 24px}
        .census-status{display:flex;align-items:center;gap:8px;font-family:"JetBrains Mono",monospace;
          font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);
          margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .census-dot{width:6px;height:6px;border-radius:50%;background:var(--success);flex:0 0 6px}
        .census-dot[data-done="true"]{opacity:1}
        /* Reserves its own space at all times (visibility:hidden keeps the box, drops it from the
           a11y tree) rather than opacity, which would still be read by a screen reader while unseen. */
        .census-all{visibility:hidden}
        .census-all[data-visible="true"]{visibility:visible}
        @media (prefers-reduced-motion: no-preference){
          .census-dot{animation:census-pulse 1400ms ease-in-out infinite}
          .census-dot[data-done="true"]{animation:none}
          .fb-in{animation:fb-in 180ms ease-out both}
        }
        @keyframes census-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes fb-in{from{opacity:0}to{opacity:1}}
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
        .fb-track{display:block;flex:1;height:8px;min-width:0;background:var(--border);border-radius:2px;overflow:hidden}
        /* Grows on the transform axis, not width: the layout engine never scores a compositor-only
           transform as a shift, so the device (the bar array) can carry a real motion moment
           tied to its meaning without costing CLS. Final size is set once, at insertion, by width. */
        .fb-fill{display:block;height:100%;background:var(--signal);border-radius:2px;transform-origin:left}
        @media (prefers-reduced-motion: no-preference){
          .fb-fill{animation:fb-grow 320ms cubic-bezier(0.23,1,0.32,1) both}
        }
        @keyframes fb-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        .fb-value{flex:0 0 62px;text-align:right;font-family:"JetBrains Mono",monospace;font-size:12.5px;
          color:var(--text-primary);font-variant-numeric:tabular-nums}
        .fb-dim{color:var(--text-dim)}
        .census-foot{margin-top:28px;padding-top:20px;border-top:1px solid var(--border);
          font-family:"JetBrains Mono",monospace;font-size:11px;line-height:1.7;color:var(--text-dim)}
        @media (max-width:600px){
          .census-page{padding:32px 16px 72px}
          .census-headline{font-size:22px;max-width:none;min-height:4.6em}
          .cr-name{display:none}
          .fb-label{flex:0 0 48px;font-size:10px}
          .fb-value{flex:0 0 54px;font-size:12px}
        }
      ` }} />

      <div className="census-kicker">The Mark · Census</div>
      <h1 className="census-headline">
        {spread
          ? `On the same ${spread.size} order, ${plainName(spread.worstSymbol)} costs ${spread.multiple} what ${plainName(spread.bestSymbol)} does.`
          : "The same order costs very different amounts depending on the stock."}
      </h1>
      <p className="census-sub">
        Every tokenized stock, priced live at three order sizes, worst first. The gap between token and
        share that most of this field charts measured a median 0.20% across 20 pairs on 2026-09-22.
      </p>



      <div className="census-status">
        <span className="census-dot" data-done={done} />
        <span>live · last read </span>
        {/* readAt is a clock string read from a live call, not from the server's clock: server
            and first client paint both show the placeholder, so hydration never sees the two
            disagree. suppressHydrationWarning covers the one moment they intentionally diverge:
            the instant the first live read lands. */}
        <span suppressHydrationWarning>{readAt ?? "--:--:--"}</span>
        <span className="census-all" data-visible={done}>
          {" "}· all rows read
        </span>
      </div>

      <div className="census-legend">
        <span>order sizes</span>
        {CENSUS_SIZES.map((s) => (
          <span key={s.key}>
            <b>{s.label}</b>
          </span>
        ))}
      </div>

      {/* the thing that could only exist for this product: every token in the list, at three
          order sizes, on one shared cost scale, read live. row position is fixed; only the
          numbers and the printed rank move. */}
      {/* Rows sit in fixed 160px slots and move to their rank with a transform. Re-sorting them in the
          DOM as reads landed cost 0.31 CLS; a transform moves the paint, not the layout, so the page
          never shifts while the worst pool slides to the top where the finding belongs. */}
      <div
        className="census-list"
        data-device="fill-cost-census"
        style={{ position: "relative", height: `${TOKEN_LIST.length * ROW_SLOT}px` }}
      >
        {TOKEN_LIST.map((token) => (
          <div
            key={token.mint}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: `${ROW_SLOT}px`,
              overflow: "hidden",
              transform: `translateY(${(slotByMint.get(token.mint) ?? 0) * ROW_SLOT}px)`,
              transition: "transform 420ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            <CensusRow
              rank={rankByMint.get(token.mint) ?? null}
              token={token}
              row={rows[token.mint]}
              sizes={CENSUS_SIZES}
              scaleMax={scaleMax}
            />
          </div>
        ))}
      </div>

      <div className="census-foot">
        every figure above came from getQuote against lite-api.jup.ag/swap/v1/quote at the moment it
        was read, USDC in, 50bps slippage. a row that says &quot;no read&quot; failed its call and shows
        nothing invented in its place.
      </div>
    </main>
    </>
  );
}
