"use client";

import { useEffect, useState } from "react";
import { fetchPrices, getQuote, NoRouteError } from "@/lib/jupiter";
import { TOKEN_LIST, USDC_MINT, displayName, getTokenBySymbol } from "@/lib/tokens";
import type { QuoteResult } from "@/lib/types";

interface AdviceProps {
  symbol: string;
  amountUsd: number;
  limitPct: number;
  blocked: boolean;
  noRoute: boolean;
  quote: QuoteResult | null;
  costByToken: Record<string, number | null>;
  // one click from a refusal to a placeable order: sets the amount the advice found
  onUseAmount?: (usd: number) => void;
}

type Option = { key: string; text: string; useAmount?: number; saving?: string };

const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: n < 100 ? 2 : 0, maximumFractionDigits: n < 100 ? 2 : 0 })}`;

// A guard that only says no is half a product. This turns the refusal into what to do instead.
// Every dollar figure here is the answer to a quote made after the main quote landed; nothing is
// estimated onto the screen. The "buy less" amount is estimated, then CHECKED with a live quote, and
// only shown if the check passes. (design/PRD-V3.md R2)
export default function Advice({ symbol, amountUsd, limitPct, blocked, noRoute, quote, costByToken, onUseAmount }: AdviceProps) {
  const [split, setSplit] = useState<Option | null>(null);
  const [less, setLess] = useState<Option | null>(null);
  const [checking, setChecking] = useState(false);
  const name = displayName(symbol);
  const mint = getTokenBySymbol(symbol)?.mint;

  useEffect(() => {
    setSplit(null);
    setLess(null);
    if (!mint || !(amountUsd >= 10)) return;
    let cancelled = false;
    const bps = Math.max(1, Math.min(5000, Math.round(limitPct * 100)));
    // one price read shared by every option, instead of one per option, on a 1 request/s key
    let ctx: Parameters<typeof getQuote>[4] = quote ? { extensions: quote.extensions, advice: true } : { advice: true };
    const q = async (usdAmount: number) => {
      if (!ctx?.price) {
        const price = (await fetchPrices([mint], "mid"))[mint];
        ctx = { ...(ctx ?? {}), ...(price ? { price } : {}) };
      }
      return getQuote(USDC_MINT, mint, String(Math.floor(usdAmount * 1e6)), bps, ctx).catch((e) => {
        if (e instanceof NoRouteError) return null;
        throw e;
      });
    };

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        // Buy less: only when blocked. A short search of at most four live checks for the largest
        // size that both routes and stays under the line: raise after a pass, lower after a fail.
        // Two fixed guesses were not enough; the market moves between one run and the next.
        if (blocked) {
          let lo = 0; // largest size known to pass
          let hi = amountUsd; // smallest size known to fail
          let size = noRoute || !quote || quote.fillCostPct <= 0
            ? amountUsd * 0.5
            : amountUsd * (limitPct / quote.fillCostPct) * 0.95;
          let best: { size: number; cost: number } | null = null;
          for (let i = 0; i < 4; i++) {
            const s = Math.floor(size / 50) * 50;
            if (s < 50 || s <= lo || s >= hi) break;
            const r = await q(s);
            if (cancelled) return;
            if (r && r.fillCostPct <= limitPct) {
              best = { size: s, cost: r.fillCostUsd };
              // show the first size that passes straight away; later checks only raise it
              setLess({
                key: "less",
                useAmount: best.size,
                saving: `${usd(best.size)} stays under your line`,
                text: `Buy up to ${usd(best.size)} of ${name} and it costs ${usd(best.cost)} extra, under your ${limitPct.toFixed(2)}% limit (checked just now).`,
              });
              lo = s;
              size = (lo + hi) / 2;
            } else {
              hi = s;
              size = lo > 0 ? (lo + hi) / 2 : s * 0.55;
            }
          }
          if (best) {
            setLess({
              key: "less",
              useAmount: best.size,
              saving: `${usd(best.size)} stays under your line`,
              text: `Buy up to ${usd(best.size)} of ${name} and it costs ${usd(best.cost)} extra, under your ${limitPct.toFixed(2)}% limit (checked just now).`,
            });
          }
        }
        // Split: three orders of a third, spaced out. Only worth saying if it saves real money.
        if (quote) {
          const third = await q(amountUsd / 3);
          if (cancelled) return;
          if (third) {
            const total = third.fillCostUsd * 3;
            const saved = quote.fillCostUsd - total;
            if (saved >= 0.5) {
              setSplit({
                key: "split",
                saving: `about ${usd(saved)} less`,
                text: `Split it into three orders of ${usd(amountUsd / 3)}, a few minutes apart so the pool can refill: about ${usd(total)} in total instead of ${usd(quote.fillCostUsd)}.`,
              });
            }
          }
        }

      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // re-run when the order or the line changes, not on every render of the quote object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, amountUsd, limitPct, blocked, noRoute, quote?.fillCostUsd]);

  // Comparison: the cheapest other stock at the same amount, from the selector's live costs.
  let compare: Option | null = null;
  const others = TOKEN_LIST.filter((t) => t.symbol !== symbol)
    .map((t) => ({ symbol: t.symbol, pct: costByToken[t.symbol] }))
    .filter((x): x is { symbol: string; pct: number } => typeof x.pct === "number")
    .sort((a, b) => a.pct - b.pct);
  if (others.length) {
    const c = others[0];
    compare = {
      key: "compare",
      text: `For comparison, the same ${usd(amountUsd)} in ${displayName(c.symbol)} costs ${usd((c.pct / 100) * amountUsd)}.`,
    };
  }

  const options = [less, split, compare].filter((o): o is Option => o !== null);

  return (
    <section
      data-advice
      style={{
        border: `1px solid ${blocked ? "var(--signal)" : "var(--border)"}`,
        borderRadius: "8px",
        padding: "20px 22px",
        background: blocked ? "rgba(196, 38, 29, 0.05)" : "var(--surface)",
        // a blocked order fills in three live answers; reserve their height so the page below does not jump
        minHeight: blocked ? "250px" : "132px",
      }}
    >
      <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 500, fontSize: "18px", color: "var(--text-primary)", margin: "0 0 12px" }}>
        {blocked ? "What you can do instead" : "Ways to pay less"}
      </h2>
      {options.length ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "10px" }}>
          {options.map((o) => (
            <li key={o.key} style={{ fontFamily: "Archivo, sans-serif", fontSize: "15px", lineHeight: 1.5, color: "var(--text-primary)", paddingLeft: "16px", position: "relative" }}>
              <span aria-hidden style={{ position: "absolute", left: 0, top: "0.55em", width: "6px", height: "6px", borderRadius: "1px", background: blocked ? "var(--signal)" : "var(--text-dim)" }} />
              {o.saving && (
                <span style={{ display: "block", fontFamily: '"JetBrains Mono", monospace', fontSize: "22px", fontWeight: 600, color: "var(--success)", marginBottom: "4px" }}>
                  {o.saving}
                </span>
              )}
              {o.text}
              {o.useAmount && onUseAmount && (
                <button
                  data-use-amount
                  onClick={() => onUseAmount(o.useAmount!)}
                  style={{
                    display: "block",
                    marginTop: "10px",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "1px solid var(--text-primary)",
                    background: "var(--text-primary)",
                    color: "var(--bg)",
                    fontFamily: "Archivo, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Use {usd(o.useAmount)}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {checking && (
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "12px", color: "var(--text-dim)", margin: options.length ? "12px 0 0" : 0 }}>
          checking other ways to buy this, live…
        </p>
      )}
      {!checking && !options.length && (
        <p style={{ fontFamily: "Archivo, sans-serif", fontSize: "14px", color: "var(--text-dim)", margin: 0 }}>
          Nothing cheaper found for this order right now.
        </p>
      )}
    </section>
  );
}
