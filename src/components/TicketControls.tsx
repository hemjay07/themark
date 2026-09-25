"use client";

import { useEffect, useRef } from "react";
import { TOKEN_LIST, displayName } from "@/lib/tokens";

interface TicketControlsProps {
  selected: string;
  onSelect: (symbol: string) => void;
  costByToken: Record<string, number | null>;
  limit: number;
  amount: string;
  onAmount: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSlider: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// What the reader sets, printed on the ticket itself: the stock as a row of stubs across the top, each
// with its live cost, and the amount on the amount line with the slider under it. The limit is typed
// into the line's own label (LimitLine). No form beside the ticket: the ticket is the app (PRD-V5).
export default function TicketControls({ selected, onSelect, costByToken, limit, amount, onAmount, onSlider }: TicketControlsProps) {
  const amountNum = parseFloat(amount) || 5000;
  const fill = Math.max(0, Math.min(100, ((amountNum - 100) / (25000 - 100)) * 100));
  // the row scrolls on a phone; the chosen stub is always brought into view
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = row.current?.querySelector<HTMLElement>(".tc-stub.on");
    if (on && row.current && row.current.scrollWidth > row.current.clientWidth) {
      row.current.scrollTo({ left: on.offsetLeft - row.current.clientWidth / 2 + on.offsetWidth / 2, behavior: "smooth" });
    }
  }, [selected]);
  return (
    <div data-controls className="tc">
      <style dangerouslySetInnerHTML={{ __html: TC_CSS }} />
      <div className="tc-stubs" data-scrolls role="tablist" aria-label="Stock" ref={row}>
        {TOKEN_LIST.map((t) => {
          const c = costByToken[t.symbol];
          const on = t.symbol === selected;
          return (
            <button key={t.mint} role="tab" aria-selected={on} aria-pressed={on} onClick={() => onSelect(t.symbol)} className={`tc-stub${on ? " on" : ""}`} title={t.name}>
              <span className="tc-name">{displayName(t.symbol)}</span>
              <span className={`tc-pct${typeof c === "number" && c > limit ? " over" : ""}`}>
                {c === undefined ? <span data-chip-loading className="tc-dash" aria-label="pricing" /> : c === null ? "—" : `${c.toFixed(2)}%`}
              </span>
            </button>
          );
        })}
      </div>
      <div className="tc-amount">
        <label className="tc-l" htmlFor="tc-amt">Amount</label>
        <span className="tc-field">
          <span className="tc-cur">$</span>
          <input id="tc-amt" type="number" min="10" max="25000" step="100" value={amount} onChange={onAmount} />
        </span>
        <input className="tc-slider" type="range" min="100" max="25000" step="100" value={amount} onChange={onSlider} aria-label="Amount" style={{ background: `linear-gradient(to right, #17140F 0%, #17140F ${fill}%, #DDD5C3 ${fill}%, #DDD5C3 100%)` }} />
        <div className="tc-ticks">
          <span>$100</span>
          <span>$12.5K</span>
          <span>$25K</span>
        </div>
      </div>
    </div>
  );
}

const TC_CSS = `
.tc{margin:6px 0 4px}
.tc-stubs{display:flex;gap:0;overflow-x:auto;scrollbar-width:none;margin:0 -8px;padding:0 8px}
.tc-stubs::-webkit-scrollbar{display:none}
.tc-stub{flex:1 0 auto;min-width:86px;display:grid;gap:3px;padding:10px 10px 9px;background:transparent;border:none;
  border-right:2px dashed var(--border);cursor:pointer;text-align:left;color:var(--text-primary);
  transition:background .15s ease-out,color .15s ease-out}
.tc-stub:last-child{border-right:none}
.tc-stub:hover{background:rgba(23,20,15,.05)}
.tc-stub.on{background:#17140F;color:#F3EEE2;border-right-color:#17140F}
.tc-stub.on + .tc-stub{border-left:none}
.tc-name{font-family:Archivo,sans-serif;font-size:13px;font-weight:600;white-space:nowrap}
.tc-pct{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--text-dim);white-space:nowrap}
.tc-stub.on .tc-pct{color:#CFC7B4}
.tc-pct.over{color:var(--signal)}
.tc-stub.on .tc-pct.over{color:#FF8A80}
.tc-dash{display:inline-block;width:26px;height:3px;border-radius:2px;background:currentColor;opacity:.35;vertical-align:middle;animation:chip-pulse 1100ms ease-in-out infinite}
.tc-amount{display:grid;grid-template-columns:auto 1fr;align-items:baseline;column-gap:14px;row-gap:8px;margin-top:16px;padding-top:14px;border-top:2px dashed var(--border)}
.tc-l{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)}
.tc-field{display:inline-flex;align-items:baseline;gap:4px;font-family:"JetBrains Mono",monospace;font-size:clamp(22px,2.4vw,30px);font-weight:600;
  border-bottom:2px solid var(--text-primary);padding-bottom:2px;justify-self:start}
.tc-cur{color:var(--text-dim)}
.tc-field input{width:7ch;background:transparent;border:none;outline:none;font:inherit;color:var(--text-primary);padding:0;-moz-appearance:textfield}
.tc-field input::-webkit-outer-spin-button,.tc-field input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.tc-slider{grid-column:1/-1;width:100%;height:4px;border-radius:2px;appearance:none;outline:none;margin-top:6px;accent-color:#17140F}
.tc-slider::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:50%;background:#17140F;border:3px solid #F3EEE2;box-shadow:0 0 0 1.5px #17140F;cursor:grab}
.tc-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#17140F;border:3px solid #F3EEE2;cursor:grab}
.tc-ticks{grid-column:1/-1;display:flex;justify-content:space-between;font-family:"JetBrains Mono",monospace;font-size:10px;color:var(--text-dim);margin-top:-2px}
@media (max-width:640px){
  .tc-stubs{display:grid;grid-template-columns:repeat(4,1fr);overflow:visible;margin:0;padding:0}
  .tc-stub{min-width:0;padding:8px 6px;border-right:2px dashed var(--border)}
  .tc-stub:nth-child(4n){border-right:none}
  .tc-stub:nth-child(-n+4){border-bottom:2px dashed var(--border)}
  .tc-name{font-size:12px}.tc-pct{font-size:10px}
}
@keyframes chip-pulse{0%,100%{opacity:.15}50%{opacity:.5}}
@media (prefers-reduced-motion:reduce){.tc-dash{animation:none}}
`;
