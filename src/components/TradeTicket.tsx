"use client";

import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import { TEAR_CSS, useTicketCut } from "@/components/TicketCut";
import { displayName } from "@/lib/tokens";
import type { ParsedExtension, QuoteResult } from "@/lib/types";
import Odometer from "@/components/Odometer";
import LimitLine from "@/components/LimitLine";
import IssuerSummary from "@/components/IssuerSummary";

interface TradeTicketProps {
  symbol: string;
  amountUsd: number;
  limitPct: number;
  quote: QuoteResult | null;
  blocked: boolean;
  noRoute: boolean;
  failed: boolean;
  mintExt: ParsedExtension[] | null | undefined;
  routeNames: string[];
  // what the reader sets, printed on the ticket above the perforation
  controls?: ReactNode;
  // the limit is typed into the line's own label
  onLimitChange?: (v: number) => void;
  // the ticket is being watched: the stamp says so instead of BLOCKED
  watching?: boolean;
  // the ticket's foot: the refusal, or the button that places the order
  children?: ReactNode;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const joinNames = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

export type TicketHandle = { cut: () => void };

// The order as a ticket: printed on paper, read line by line, and stamped BLOCKED when it costs more
// than the reader allows. Every figure on it comes off the live quote already on the page. The page
// can cut it: the ticket tears and the smaller one is revealed (design/CREATIVE.md, device 1).
const TradeTicket = forwardRef<TicketHandle, TradeTicketProps>(function TradeTicket(props, handle) {
  const { symbol, amountUsd, quote, blocked } = props;
  const name = displayName(symbol);
  const art = useRef<HTMLElement>(null);
  const { cut, overlay } = useTicketCut(art);
  useImperativeHandle(handle, () => ({ cut }), [cut]);

  return (
    <div data-hero style={{ width: "100%" }}>
      <style dangerouslySetInnerHTML={{ __html: TICKET_CSS }} />
      <div className="tk-wrap">
      <article className="ticket" ref={art} data-ticket>
        <header className="tk-head">
          <span>Order ticket</span>
          <span>Buy with USDC</span>
        </header>
        {props.controls ?? (
          <div className="tk-order">
            <span className="tk-stock">{name}</span>
            <span className="tk-amt">{usd(amountUsd)}</span>
          </div>
        )}
        <hr className="tk-perf" />
        <TicketCost {...props} name={name} />
        {/* the verdict and the way out sit right under the stamp, on the first screen */}
        <footer className="tk-foot">{props.children}</footer>
        <IssuerSummary symbol={symbol} extensions={props.mintExt} loading={props.mintExt === undefined} />
        {quote && <TicketRows quote={quote} routeNames={props.routeNames} />}
      </article>
      {overlay}
      </div>
    </div>
  );
});

export default TradeTicket;

function TicketCost({ quote, noRoute, failed, blocked, name, amountUsd, limitPct, onLimitChange, watching }: TradeTicketProps & { name: string }) {
  return (
    <>
      <div className="tk-label">What this order costs you</div>
      <div className={`tk-cost${blocked ? " is-blocked" : ""}${noRoute ? " is-words" : ""}`}>
        {noRoute ? (
          "No exchange can fill it"
        ) : quote ? (
          <Odometer value={quote.fillCostUsd} prefix="$" durationMs={420} />
        ) : failed ? (
          "$—"
        ) : (
          <span className="tk-shimmer" aria-label="reading the market" />
        )}
      </div>
      <div className="tk-sub">
        {noRoute
          ? `No exchange on Solana can fill ${usd(amountUsd)} of ${name} right now.`
          : quote
            ? `extra on your ${usd(amountUsd)} of ${name}, ${quote.fillCostPct.toFixed(2)}% of what you spend`
            : failed
              ? "no live price right now"
              : "reading the market right now"}
      </div>
      <div className="tk-line">
        <LimitLine
          costUsd={noRoute ? 0 : quote?.fillCostUsd ?? 0}
          limitPct={limitPct}
          fillPct={quote?.fillCostPct ?? 0}
          amountUsd={amountUsd}
          isBlocked={blocked}
          onLimitChange={onLimitChange}
        />
        {/* stamped beside the figure on a wide screen, under the line on a phone, never over the figure */}
        {blocked && (quote || noRoute) && (
          <div data-seal key={watching ? "watch" : "block"} className={`tk-stamp${watching ? " is-watch" : ""}`} aria-label={watching ? "Watching the line" : "Blocked"}>
            {watching ? "WATCHING" : "BLOCKED"}
          </div>
        )}
        {!blocked && quote && (
          <div key="clears" className="tk-stamp is-clear" aria-label="Within your limit">
            CLEARS
          </div>
        )}
      </div>
    </>
  );
}

function TicketRows({ quote, routeNames }: { quote: QuoteResult; routeNames: string[] }) {
  const kept = Math.max(0, quote.amountInUsd - quote.fillCostUsd);
  return (
    <div className="tk-rows">
      <div data-kept className="tk-row">
        <span>You keep, in shares</span>
        <b className="tk-good"><Odometer value={kept} prefix="$" /></b>
      </div>
      <p data-route className="tk-route">
        {routeNames.length ? `Fills through ${joinNames(routeNames)}.` : "Where this order fills is shown once it is quoted."}
      </p>
    </div>
  );
}

// Paper on a dark page. The ticket redefines the page's colour tokens, so the limit line and the
// issuer list inside it print in ink without knowing they are on paper.
export const TICKET_CSS = TEAR_CSS + `
.tk-h1{font-family:Archivo,sans-serif;font-weight:600;font-size:clamp(34px,4.2vw,56px);line-height:1.02;
  letter-spacing:-0.02em;color:var(--text-primary);margin:0 0 12px}
.tk-lede{font-family:Archivo,sans-serif;font-size:clamp(16px,1.5vw,19px);line-height:1.45;color:var(--text-muted);
  margin:0 0 18px;max-width:46ch}
.tk-steps{list-style:none;display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 26px;padding:0;
  font-family:Archivo,sans-serif;font-size:14px;color:var(--text-muted)}
.tk-steps li{display:flex;align-items:center;gap:8px}
.tk-steps-end{color:var(--text-dim)}
.tk-steps-end::before{content:"→";margin-right:2px}
.step-n{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;
  background:var(--text-primary);color:var(--bg);font-family:"JetBrains Mono",monospace;font-size:11px;
  font-weight:700;margin-right:8px;letter-spacing:0;flex:none}
.tk-steps .step-n{margin-right:0}
.ticket{--text-primary:#17140F;--text-muted:#4B463C;--text-dim:#7B7467;--border:#DDD5C3;--bg:#F3EEE2;
  --signal:#C4261D;--success:#0B7A3B;position:relative;background:#F3EEE2;color:var(--text-primary);
  border-radius:4px;padding:30px clamp(20px,3vw,36px) 28px;box-shadow:0 30px 60px -30px rgba(0,0,0,.8),
  0 2px 0 rgba(255,255,255,.04);animation:tk-print 620ms cubic-bezier(.2,.9,.25,1) both;overflow:hidden}
.ticket::before,.ticket::after{content:"";position:absolute;left:0;right:0;height:10px;
  background:radial-gradient(circle at 8px 0,#0A0A0F 5px,transparent 5.5px) 0 0/16px 10px repeat-x}
.ticket::before{top:0}
.ticket::after{bottom:0;transform:scaleY(-1)}
.tk-head{display:flex;justify-content:space-between;font-family:"JetBrains Mono",monospace;font-size:11px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin-bottom:14px}
.tk-order{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
.tk-stock{font-family:Archivo,sans-serif;font-weight:600;font-size:clamp(26px,2.6vw,34px);letter-spacing:-0.01em}
.tk-amt{font-family:"JetBrains Mono",monospace;font-size:clamp(20px,2vw,26px);font-variant-numeric:tabular-nums}
.tk-perf{border:none;border-top:2px dashed var(--border);margin:20px -8px 22px}
.tk-label{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--text-dim);margin-bottom:22px}
.tk-cost{font-family:"JetBrains Mono",monospace;font-weight:600;font-size:clamp(52px,6.4vw,96px);line-height:1;
  min-height:1em;letter-spacing:-0.03em;font-variant-numeric:tabular-nums;color:var(--text-primary);
  transition:color 320ms ease-out}
.tk-cost.is-blocked{color:var(--signal)}
.tk-cost.is-words{font-family:Archivo,sans-serif;font-size:clamp(28px,3.2vw,44px)}
.tk-sub{font-family:Archivo,sans-serif;font-size:clamp(15px,1.3vw,17px);line-height:1.45;color:var(--text-muted);
  margin-top:10px}
.tk-shimmer{display:inline-block;width:5.2ch;height:.78em;border-radius:6px;vertical-align:middle;
  background:#E4DCCB;position:relative;overflow:hidden}
.tk-shimmer::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#F7F3EA,transparent);
  transform:translateX(-100%);animation:tk-shine 1.1s linear infinite}
.ticket [data-issuer]{margin-top:4px;padding-top:18px;border-top:2px dashed var(--border)}
.ticket [data-issuer] h2{font-size:15px!important;text-transform:uppercase;letter-spacing:.08em;
  font-family:"JetBrains Mono",monospace!important;color:var(--text-dim)!important}
.tk-rows{margin-top:20px;padding-top:16px;border-top:2px dashed var(--border);display:grid;gap:6px}
.tk-row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;font-family:Archivo,sans-serif;
  font-size:15px;color:var(--text-muted);padding:4px 0}
.tk-row b{font-family:"JetBrains Mono",monospace;font-weight:600;color:var(--text-primary);white-space:nowrap}
.tk-row b.tk-good{color:var(--success)}.tk-row b.tk-bad{color:var(--signal)}
.tk-route{font-family:Archivo,sans-serif;font-size:14px;color:var(--text-dim);margin:6px 0 0}
.tk-foot{min-height:150px}
.tk-foot:not(:empty){margin-top:8px;padding-top:18px;border-top:2px dashed var(--border)}
.lt-ticket .tk-foot{min-height:0}
.tk-line{position:relative}
@media (max-width:640px){.tk-line{padding-bottom:46px}.tk-stamp{bottom:0}}
@media (min-width:901px){.tk-line .tk-stamp{bottom:auto;top:-128px;right:6px}.lt-ticket .tk-line .tk-stamp{top:auto;bottom:4px;right:0}}
.tk-stamp.is-watch{color:#17140F;border-color:#17140F}
.tk-stamp.is-clear{color:#0B7A3B;border-color:#0B7A3B}
.tk-stamp{position:absolute;right:0;bottom:4px;z-index:5;pointer-events:none;
  font-family:Archivo,sans-serif;font-weight:800;font-size:clamp(24px,2.6vw,34px);letter-spacing:.12em;
  color:#C4261D;border:4px double #C4261D;border-radius:6px;padding:4px 16px 2px;transform:rotate(-8deg);
  opacity:.9;will-change:transform,opacity;
  -webkit-mask-image:radial-gradient(circle at 30% 40%,#000 55%,rgba(0,0,0,.72) 75%,#000 100%);
  mask-image:radial-gradient(circle at 30% 40%,#000 55%,rgba(0,0,0,.72) 75%,#000 100%);
  animation:tk-slam 320ms cubic-bezier(.2,1.3,.35,1) both}
@keyframes tk-print{from{transform:translateY(-18px) rotate(-.6deg)}to{transform:none}}
.tk-stamp.is-clear{color:#0B7A3B;border-color:#0B7A3B}
@keyframes tk-slam{0%{opacity:0;transform:rotate(-14deg) scale(1.35)}55%{opacity:.95;transform:rotate(-7deg) scale(.96)}
  100%{opacity:.9;transform:rotate(-8deg) scale(1)}}
@keyframes tk-shine{to{transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.ticket,.tk-stamp,.tk-shimmer::after{animation:none!important}}
`;
