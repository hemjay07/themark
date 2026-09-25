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
  // the size that passed, reported up so the page can offer it where the order is placed
  onLead?: (usd: number | null) => void;
  // stubs mode: only the split and the cheaper stock, as torn stubs; the cut is on the ticket itself
  stubs?: boolean;
  // whether the search for a size that fits is still running
  onSearching?: (b: boolean) => void;
}

type Option = { key: string; text: string; useAmount?: number; saving?: string };

const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: n < 100 ? 2 : 0, maximumFractionDigits: n < 100 ? 2 : 0 })}`;

// A guard that only says no is half a product. This turns the refusal into what to do instead.
// Every dollar figure here is the answer to a quote made after the main quote landed; nothing is
// estimated onto the screen. The "buy less" amount is estimated, then CHECKED with a live quote, and
// only shown if the check passes. (design/PRD-V3.md R2)
export default function Advice({ symbol, amountUsd, limitPct, blocked, noRoute, quote, costByToken, onUseAmount, onLead, stubs, onSearching }: AdviceProps) {
  const [split, setSplit] = useState<Option | null>(null);
  const [less, setLess] = useState<Option | null>(null);
  const [checking, setChecking] = useState(false);
  const name = displayName(symbol);
  useEffect(() => {
    onLead?.(less?.useAmount ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [less]);
  useEffect(() => {
    onSearching?.(checking);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);
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
          // Buy less: the cost does not rise smoothly with size (routes split across pools differently
          // at each size), so a binary search can land on a size that passed once by luck. Step down
          // from an estimate instead, and only suggest a size that passes on two separate quotes, under
          // 90% of the line, so it still passes when the person clicks it.
          const target = limitPct * 0.9;
          const start = noRoute || !quote || quote.fillCostPct <= 0
            ? amountUsd * 0.5
            : amountUsd * Math.min(0.9, target / quote.fillCostPct);
          let smallest: { size: number; pct: number } | null = null;
          let found = false;
          for (const f of [1, 0.55, 0.3, 0.15, 0.07]) {
            const s = Math.floor((start * f) / 50) * 50;
            if (s < 50) break;
            const r = await q(s);
            if (cancelled) return;
            if (r) smallest = { size: s, pct: r.fillCostPct };
            if (!r || r.fillCostPct > target) continue;
            const again = await q(s);
            if (cancelled) return;
            if (!again || again.fillCostPct > target) continue;
            const cost = Math.max(r.fillCostUsd, again.fillCostUsd);
            setLess({
              key: "less",
              useAmount: s,
              saving: `${usd(s)} stays under your line`,
              text: `Buy up to ${usd(s)} of ${name} and it costs ${usd(cost)} extra, under your ${limitPct.toFixed(2)}% limit (checked twice just now).`,
            });
            found = true;
            break;
          }
          // nothing smaller fits: say so, with the smallest size checked, instead of saying nothing
          if (!found && smallest && smallest.pct > limitPct) {
            setLess({
              key: "less",
              text: `No size fits under your ${limitPct.toFixed(2)}% limit right now. Even ${usd(smallest.size)} of ${name} costs ${smallest.pct.toFixed(2)}% extra.`,
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

  const options = (stubs ? [split, compare] : [less, split, compare]).filter((o): o is Option => o !== null);

  return (
    <section data-advice className={`ad${blocked ? " is-blocked" : ""}${stubs ? " is-stubs" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: ADVICE_CSS }} />
      <h2 className="ad-h">{stubs ? "Other ways out" : blocked ? "What you can do instead" : "Ways to pay less"}</h2>
      {options.length > 0 && (
        <ul className="ad-list">
          {options.map((o, i) => (
            <li key={o.key} data-stub className={`ad-stub${o.useAmount ? " is-lead" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>
              {o.saving && <span className="ad-save">{o.saving}</span>}
              <span className="ad-text">{o.text}</span>
              {o.useAmount && onUseAmount && (
                <button data-use-amount className="ad-use" onClick={() => onUseAmount(o.useAmount!)}>
                  Use {usd(o.useAmount)} <span aria-hidden>→</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {checking && (
        <div className="ad-wait" aria-label="checking other ways to buy this, live">
          <span className="ad-bar" />
          <span className="ad-bar short" />
          <span className="ad-note">checking other ways to buy this, live</span>
        </div>
      )}
      {!checking && !options.length && (quote || noRoute) && (
        <p className="ad-none">Nothing cheaper found for this order right now.</p>
      )}
    </section>
  );
}

// A blocked order fills in up to three live answers; the section reserves their height so the page
// does not jump, and each answer slides in toward the ticket as it lands.
const ADVICE_CSS = `
.ad{min-height:132px}.ad.is-blocked{min-height:250px}
.ad.is-stubs{min-height:0}.ad.is-stubs .ad-h{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);font-weight:400;margin:0 0 10px}
.ad.is-stubs .ad-stub{background:#F3EEE2;color:#17140F;border:none;border-radius:2px 2px 6px 6px;padding:18px 18px 16px 20px;
  clip-path:polygon(0 8px,3% 0,7% 8px,11% 0,15% 8px,19% 0,23% 8px,27% 0,31% 8px,35% 0,39% 8px,43% 0,47% 8px,51% 0,55% 8px,59% 0,63% 8px,67% 0,71% 8px,75% 0,79% 8px,83% 0,87% 8px,91% 0,95% 8px,100% 0,100% 100%,0 100%);
  transform:rotate(-.6deg)}
.ad.is-stubs .ad-stub:nth-child(2){transform:rotate(.7deg)}
.ad.is-stubs .ad-stub::before{display:none}
.ad.is-stubs .ad-save{color:#0B7A3B;font-size:22px}
.ad.is-stubs .ad-text{color:#4B463C;font-size:14px}
.ad-h{font-family:Archivo,sans-serif;font-weight:600;font-size:20px;color:var(--text-primary);margin:0 0 14px}
.ad-list{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.ad-stub{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:10px;
  padding:16px 18px 16px 22px;font-family:Archivo,sans-serif;font-size:15px;line-height:1.5;color:var(--text-primary);
  animation:ad-in 420ms cubic-bezier(.2,.8,.2,1) both}
.ad-stub::before{content:"";position:absolute;left:-1px;top:14px;bottom:14px;width:3px;border-radius:2px;background:var(--text-dim)}
.ad-stub.is-lead{border-color:rgba(11,122,59,.55);background:linear-gradient(180deg,rgba(11,122,59,.10),rgba(11,122,59,.03))}
.ad-stub.is-lead::before{background:var(--success)}
.ad-save{display:block;font-family:"JetBrains Mono",monospace;font-size:20px;font-weight:600;color:#3DBE74;margin-bottom:4px}
.ad-text{display:block;color:var(--text-muted)}
.ad-use{margin-top:12px;padding:11px 18px;border-radius:6px;border:none;background:#3DBE74;color:#06140C;
  font-family:Archivo,sans-serif;font-size:15px;font-weight:700;cursor:pointer;
  transition:transform 120ms ease-out,filter 160ms ease-out}
.ad-use:hover{transform:translateX(3px);filter:brightness(1.08)}
.ad-use:active{transform:scale(.97)}
.ad-wait{display:grid;gap:8px;margin-top:12px}
.ad-bar{display:block;height:14px;border-radius:4px;width:100%;background:var(--surface);position:relative;overflow:hidden}
.ad-bar::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#1E1E28,transparent);
  transform:translateX(-100%);animation:ad-shine 1.1s linear infinite}
.ad-bar.short{width:62%}
.ad-note{font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--text-dim)}
.ad-none{font-family:Archivo,sans-serif;font-size:14px;color:var(--text-dim);margin:0}
@keyframes ad-in{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:none}}
@keyframes ad-shine{to{transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.ad-stub,.ad-bar::after{animation:none!important}}
`;
