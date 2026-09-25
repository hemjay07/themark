"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTicketCut } from "@/components/TicketCut";
import LimitLine from "@/components/LimitLine";
import Odometer from "@/components/Odometer";
import Scene from "@/components/landing/Scene";

export type Row = { symbol: string; name: string; pct: number };
export type Gap = { symbol: string; name: string; reason: string };

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
// a cost under a dollar is said as such, not as "$0" or "0.00%"
const usdOrUnder = (n: number) => (n < 1 ? "under $1" : usd(n));
const pctOrNothing = (p: number) => (p < 0.005 ? "almost nothing" : `${p.toFixed(2)}%`);
const ORDER = 25000;
const LIMIT = 1;

export type Fit = { usd: number; pct: number };
type PaperHandle = { cut: () => void };

// A paper ticket for one stock against a 1% line, stamped by its live census cost. `fit` prints it at
// the smaller size that fits instead of the full $25,000.
export const PaperTicket = forwardRef<PaperHandle, { row: Row | null; fit?: Fit | null }>(function PaperTicket({ row, fit }, handle) {
  const size = fit ? fit.usd : ORDER;
  const pct = fit ? fit.pct : row?.pct ?? 0;
  const blocked = row ? pct > LIMIT : false;
  const cost = row ? (pct / 100) * size : 0;
  const art = useRef<HTMLElement>(null);
  const { cut, overlay } = useTicketCut(art);
  useImperativeHandle(handle, () => ({ cut }), [cut]);
  return (
    <div className="tk-wrap">
    <article className="ticket lt-ticket" ref={art}>
      <header className="tk-head">
        <span>Order ticket</span>
        <span>Buy with USDC</span>
      </header>
      <div className="tk-order">
        <span className="tk-stock">{row ? row.name : "…"}</span>
        <span className="tk-amt"><Odometer value={size} decimals={0} prefix="$" /></span>
      </div>
      <hr className="tk-perf" />
      <div className="tk-label">What this order costs you</div>
      <div className={`tk-cost${blocked ? " is-blocked" : ""}`}>
        {row ? <Odometer key={row.symbol} value={cost} prefix="$" durationMs={520} /> : <span className="tk-shimmer" />}
      </div>
      <div className="tk-sub">{row ? `extra, ${pct.toFixed(2)}% of what you spend` : "reading the market"}</div>
      <div className="tk-line">
        <LimitLine costUsd={cost} limitPct={LIMIT} fillPct={pct} amountUsd={size} isBlocked={blocked} />
        {row && (
          <div key={`${row.symbol}-${blocked}-${size}`} className={`tk-stamp${blocked ? "" : " is-clear"}`}>
            {blocked ? "BLOCKED" : "CLEARS"}
          </div>
        )}
      </div>
    </article>
    {overlay}
    </div>
  );
});

// The tape: every stock's live cost on $25,000, moving across a strip of paper (device 3).
export function TickerTape({ rows }: { rows: Row[] }) {
  const items = rows.length
    ? rows.map((r) => `${r.name} ${r.pct.toFixed(2)}% · ${usdOrUnder((r.pct / 100) * ORDER)} extra on ${usd(ORDER)}`)
    : ["reading every stock right now"];
  const line = items.join("   ▪   ") + "   ▪   ";
  return (
    <div className="tape-strip" aria-label="live costs" data-scrolls>
      <div className="tape-run">
        <span>{line}</span>
        <span aria-hidden>{line}</span>
      </div>
    </div>
  );
}

// The hero's loop: the full order prints and is stamped BLOCKED, then it is cut to the size that
// fits and the smaller ticket is revealed, stamped CLEARS. Then it prints again (device 1).
function useHeroLoop(worst: Row | null, fit: Fit | null) {
  const [phase, setPhase] = useState<"full" | "fit">("full");
  const ticket = useRef<PaperHandle>(null);
  useEffect(() => {
    if (!worst || !fit) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    let first = true;
    const step = (next: "full" | "fit") => {
      t = setTimeout(() => {
        if (!alive) return;
        if (next === "fit") ticket.current?.cut();
        setPhase(next);
        step(next === "fit" ? "full" : "fit");
      }, next === "fit" ? (first ? 9000 : 4200) : 3400);
      first = false;
    };
    step("fit");
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [worst?.symbol, fit?.usd]); // eslint-disable-line react-hooks/exhaustive-deps
  return { phase, ticket };
}

export function SceneHero({ worst, fit, rows }: { worst: Row | null; fit: Fit | null; rows: Row[] }) {
  const { phase, ticket } = useHeroLoop(worst, fit);
  return (
    <Scene id="top" index={1} className="s-hero">
      <TickerTape rows={rows} />
      <div className="hero-grid">
        <div>
          <h1 className="mega rv wipe">
            Don&apos;t be
            <br />
            the <span className="red ink">mark.</span>
          </h1>
          <p className="lede rv" style={{ ["--d" as string]: "160ms" }}>
            THE MARK shows what a tokenized stock really costs you before you buy it on Solana, and stops the
            trade if that cost is more than you allow.
          </p>
          <div className="ctas rv" style={{ ["--d" as string]: "260ms" }}>
            <a className="btn-red" href="/check">
              Launch app <span aria-hidden>→</span>
            </a>
            <a className="btn-ghost" href="#cost">
              See how it works
            </a>
          </div>
        </div>
        <div className="hero-ticket rv" style={{ ["--d" as string]: "200ms" }}>
          <PaperTicket ref={ticket} row={worst} fit={phase === "fit" ? fit : null} />
        </div>
      </div>
      <a className="scroll-cue" href="#cost">
        Scroll <span aria-hidden>↓</span>
      </a>
    </Scene>
  );
}

export function SceneCost({ worst }: { worst: Row | null }) {
  const max = Math.max(0.2, worst?.pct ?? 0.2);
  return (
    <Scene id="cost" index={2} kicker="The price isn't the cost">
      <h2 className="big rv wipe">
        Everyone charts the gap.
        <br />
        <span className="dim">You pay the fill.</span>
      </h2>
      <div className="duel">
        <div className="duel-side rv" style={{ ["--d" as string]: "120ms" }}>
          <div className="num dim">0.20%</div>
          <div className="duel-bar">
            <span style={{ width: `${(0.2 / max) * 100}%` }} />
          </div>
          <p>The gap between a token and its share: the median of 20 pairs, measured on 22 September. It is the number most dashboards chart.</p>
        </div>
        <div className="duel-side rv" style={{ ["--d" as string]: "240ms" }}>
          <div className="num red">{worst ? <Odometer value={worst.pct} suffix="%" /> : "…"}</div>
          <div className="duel-bar is-red">
            <span style={{ width: worst ? "100%" : "0%" }} />
          </div>
          <p>
            What {usd(ORDER)} of {worst?.name ?? "the costliest stock"} costs you to fill right now: the price moving
            against your order in the pool, plus the token&apos;s own fee. Nothing on a price chart shows it.
          </p>
        </div>
      </div>
    </Scene>
  );
}

export function SceneMoves() {
  const moves = [
    { n: "01", t: "Pick a stock", d: "Eight tokenized stocks on Solana, from the S&P 500 to OpenAI." },
    { n: "02", t: "Set how much, and your limit", d: "Your limit is the most extra you will pay, as a share of the order." },
    { n: "03", t: "Placed, or blocked", d: "Under your limit, your wallet signs it. Over it, THE MARK stops it before your wallet is asked." },
  ];
  return (
    <Scene id="how" index={3} kicker="How it works">
      <h2 className="big rv wipe">
        Three moves.
        <br />
        <span className="dim">One line you set.</span>
      </h2>
      <div className="moves">
        {moves.map((m, i) => (
          <div key={m.n} className="move rv" style={{ ["--d" as string]: `${120 + i * 110}ms` }}>
            <div className="move-n">{m.n}</div>
            <div className="move-t">{m.t}</div>
            <p>{m.d}</p>
            {i === 2 && (
              <div className="move-stamps">
                <span className="mini-stamp red">BLOCKED</span>
                <span className="mini-stamp green">CLEARS</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <a className="btn-red rv" style={{ ["--d" as string]: "480ms" }} href="/check">
        Launch app <span aria-hidden>→</span>
      </a>
    </Scene>
  );
}

export function SceneField({ rows, gaps, readAt }: { rows: Row[]; gaps: Gap[]; readAt: number | null }) {
  const max = Math.max(...rows.map((r) => r.pct), 0.01);
  return (
    <Scene id="field" index={4} kicker="The same order, eight prices">
      <div className="split">
        <div>
          <h2 className="big rv wipe">
            Same {usd(ORDER)}.
            <br />
            <span className="dim">Very different bills.</span>
          </h2>
          <p className="body rv" style={{ ["--d" as string]: "140ms" }}>
            Every stock, the same order, read live. The costliest pool can charge many times what the cheapest does, and
            it moves by the hour.
          </p>
          <a className="btn-ghost rv" style={{ ["--d" as string]: "240ms" }} href="/census">
            Compare all sizes <span aria-hidden>→</span>
          </a>
        </div>
        <div className="bars rv" style={{ ["--d" as string]: "120ms", ["--line" as string]: `${Math.min(100, (LIMIT / max) * 100)}%` }}>
          {rows.length === 0 && <p className="body">Taking the first reading: about 25 seconds.</p>}
          {rows.length > 0 && (
            <div className="bar-head" aria-hidden>
              <span />
              <span className="bar-track-legend"><em>your line {LIMIT}%</em></span>
              <span />
            </div>
          )}
          {rows.map((r, i) => (
            <div key={r.symbol} className="bar-row" style={{ ["--d" as string]: `${200 + i * 70}ms` }}>
              <span className="bar-name">{r.name}</span>
              <span className="bar-track">
                <span className={`bar-fill${r.pct > LIMIT ? " is-red" : ""}`} style={{ width: `${Math.max(1.5, (r.pct / max) * 100)}%` }} />
              </span>
              <span className="bar-val">
                {r.pct.toFixed(2)}% <em>{usd((r.pct / 100) * ORDER)}</em>
              </span>
            </div>
          ))}
          {gaps.map((g) => (
            <div key={g.symbol} className="bar-row is-gap">
              <span className="bar-name">{g.name}</span>
              <span className="bar-gap">{g.reason}</span>
              <span className="bar-val">—</span>
            </div>
          ))}
          {readAt && <div className="bars-note">read {Math.max(0, Math.round((Date.now() - readAt) / 60000))} min ago · refreshes every 2 min</div>}
        </div>
      </div>
    </Scene>
  );
}

export function SceneStamp({ rows }: { rows: Row[] }) {
  // three stocks across the range, cycled: the stamp decides each one against the same 1% line
  const picks = rows.length >= 3 ? [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]] : rows;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (picks.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % picks.length), 2800);
    return () => clearInterval(t);
  }, [picks.length]);
  return (
    <Scene id="line" index={5} kicker="Stamped before you sign">
      <div className="split">
        <div>
          <h2 className="big rv wipe">
            Over your line,
            <br />
            <span className="red">it never reaches your wallet.</span>
          </h2>
          <p className="body rv" style={{ ["--d" as string]: "140ms" }}>
            Set your limit once. Every order is priced for its exact size and checked against it. Under the line it clears.
            Over it, the order is stamped and stopped.
          </p>
        </div>
        <div className="rv" style={{ ["--d" as string]: "160ms" }}>
          <PaperTicket row={picks[i] ?? null} />
        </div>
      </div>
    </Scene>
  );
}

export function SceneInstead({ worst, best, worst5k }: { worst: Row | null; best: Row | null; worst5k: number | null }) {
  const stubs = [
    worst && worst5k !== null
      ? { t: "Buy less", d: `${usd(5000)} of ${worst.name} costs ${worst5k.toFixed(2)}% instead of ${worst.pct.toFixed(2)}%. The app finds the largest size that fits, checked twice.` }
      : null,
    { t: "Split it", d: "Three smaller orders a few minutes apart, so the pool can refill. The app quotes the exact saving before you choose." },
    best ? { t: "Pick another stock", d: `The same ${usd(ORDER)} in ${best.name} costs ${pctOrNothing(best.pct)} right now.` } : null,
  ].filter((x): x is { t: string; d: string } => x !== null);
  return (
    <Scene id="instead" index={6} kicker="Blocked isn't the end">
      <div className="split">
        <div>
          <h2 className="big rv wipe">
            A no,
            <br />
            <span className="dim">with a way through.</span>
          </h2>
          <p className="body rv" style={{ ["--d" as string]: "140ms" }}>
            A guard that only says no is half a product. When an order is blocked, THE MARK finds the largest size that
            fits, the split that saves, and the stock that costs less, each with a live figure, and one click uses it.
          </p>
          <a className="btn-ghost rv" style={{ ["--d" as string]: "240ms" }} href="/check">
            Try it on an order <span aria-hidden>→</span>
          </a>
        </div>
        <div className="stubs">
          {stubs.map((s, i) => (
            <div key={s.t} className="stub rv" style={{ ["--d" as string]: `${120 + i * 120}ms` }}>
              <div className="stub-t">{s.t}</div>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}
