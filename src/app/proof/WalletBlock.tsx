"use client";

import { useEffect, useState } from "react";
import Odometer from "@/components/Odometer";

type Trade = {
  signature: string;
  side: "buy" | "sell";
  symbol: string;
  name: string;
  usd: number;
  shares: number;
  vsShareUsd: number | null;
  vsSharePct: number | null;
  referenceKind: "share" | "token";
  blockTime: number | null;
};
type Holding = {
  symbol: string;
  name: string;
  shares: number;
  valueUsd: number | null;
  referenceKind: "share" | "token";
  sellUsd: number | null;
  exitCostUsd: number | null;
};
type Scan = {
  address: string;
  readAt: number;
  partial: boolean;
  unread: number;
  trades: Trade[];
  totals: { trades: number; priced: number; movedUsd: number; overpaidUsd: number; overpaidPct: number | null };
  holdings: Holding[];
  holdingsTotals: { valueUsd: number; sellUsd: number; exitCostUsd: number };
};

// a figure that rounds to zero is zero: no "-$0.00"
const usd = (n: number, d = 2) => `${n < -0.005 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const pct = (n: number) => `${Math.abs(n) < 0.05 ? "0.0" : n.toFixed(1)}%`;
const when = (t: number | null) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : "");

// "Were you the mark?" for one wallet: every tokenized-stock trade it made, priced against the real
// share (or, for a private company, the token's price now), and what getting out today would cost.
export default function WalletBlock({ address }: { address: string }) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState("");
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setScan(null);
    setError("");
    setSecs(0);
    const tick = setInterval(() => setSecs((s) => s + 1), 1000);
    fetch(`/api/wallet?address=${encodeURIComponent(address)}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `the wallet could not be read (${r.status})`);
        if (!cancelled) setScan(data as Scan);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "the wallet could not be read");
      })
      .finally(() => clearInterval(tick));
    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [address]);

  if (error) {
    return (
      <div className="wb-refused">
        <div className="wb-k" style={{ color: "var(--signal)" }}>refused</div>
        <p>{error}</p>
      </div>
    );
  }
  if (!scan) {
    return (
      <div className="wb-wait">
        <div className="wb-k">reading {address.slice(0, 4)}…{address.slice(-4)} off mainnet</div>
        <p>
          Finding every tokenized-stock trade this wallet made, then pricing each one. About 10 to 30 seconds.
          {secs > 0 && ` ${secs}s.`}
        </p>
        <span className="wb-bar" />
      </div>
    );
  }

  const t = scan.totals;
  const over = t.overpaidUsd > 0;
  const priced = scan.trades.filter((x) => x.vsShareUsd !== null);
  const privateOnly = priced.length > 0 && priced.every((x) => x.referenceKind === "token");
  const mixed = priced.some((x) => x.referenceKind === "token") && !privateOnly;
  const h = scan.holdingsTotals;

  return (
    <div className="wb">
      <style dangerouslySetInnerHTML={{ __html: WB_CSS }} />
      {t.priced === 0 ? (
        <>
          <div className="wb-k">this wallet</div>
          <p className="wb-lede">No tokenized-stock trades found for this wallet among the eight stocks THE MARK tracks.</p>
        </>
      ) : (
        <>
          <div className="wb-k">{over ? "what this wallet paid over" : "this wallet came in under"}</div>
          <div className="wb-num" style={{ color: over ? "var(--signal)" : "var(--success)" }}>
            <Odometer value={Math.abs(t.overpaidUsd)} prefix="$" />
          </div>
          <p className="wb-lede">
            {over ? "more" : "less"} than its {t.priced} tokenized-stock trade{t.priced === 1 ? "" : "s"} ({usd(t.movedUsd, 0)} moved) were worth at{" "}
            {privateOnly ? "the tokens' prices now" : mixed ? "the real share price, or the token's price now for private companies" : "the real share price"}
            {t.overpaidPct !== null ? `, ${Math.abs(t.overpaidPct).toFixed(2)}% of what moved` : ""}.
          </p>
          <p className="wb-note">
            Prices are read now, not at the moment of each trade, so what the market has done since is in this figure too.
            {scan.partial ? " Only the 30 most recent trades are counted." : ""}
            {scan.unread > 0 ? ` ${scan.unread} trade${scan.unread === 1 ? "" : "s"} could not be read this time; scan again in a minute.` : ""}
          </p>
        </>
      )}

      {scan.holdings.length > 0 && (
        <div className="wb-hold">
          <div className="wb-k">what it holds now, and the toll for getting out today</div>
          <div className="wb-row wb-head">
            <span>stock</span>
            <span>shares</span>
            <span>worth</span>
            <span>sells for</span>
            <span>toll</span>
          </div>
          {scan.holdings.map((x) => (
            <div key={x.symbol} className="wb-row">
              <span>{x.name}</span>
              <span>{x.shares.toFixed(4)}</span>
              <span>{x.valueUsd === null ? "—" : usd(x.valueUsd)}</span>
              <span>{x.sellUsd === null ? "no route" : usd(x.sellUsd)}</span>
              <span style={{ color: x.exitCostUsd !== null && x.exitCostUsd > 0.005 ? "var(--signal)" : "var(--text-primary)" }}>
                {x.exitCostUsd === null ? "—" : usd(x.exitCostUsd)}
              </span>
            </div>
          ))}
          <div className="wb-row wb-total">
            <span>all of it</span>
            <span />
            <span>{usd(h.valueUsd)}</span>
            <span>{usd(h.sellUsd)}</span>
            <span style={{ color: h.exitCostUsd > 0.005 ? "var(--signal)" : "var(--text-primary)" }}>{usd(h.exitCostUsd)}</span>
          </div>
          <p className="wb-note">The toll is what the pools keep if the wallet sold everything right now, against the tokens&apos; own prices: the price moving against the order, plus each token&apos;s fee.</p>
        </div>
      )}

      {scan.trades.length > 0 && (
        <div className="wb-trades">
          <div className="wb-k">every trade, newest first</div>
          <div className="wb-row wb-head wb-t">
            <span>date</span>
            <span>trade</span>
            <span>moved</span>
            <span>vs {privateOnly ? "price now" : "the share"}</span>
          </div>
          {scan.trades.map((x) => (
            <a key={x.signature} href={`/proof?sig=${x.signature}`} className="wb-row wb-t wb-link">
              <span>{when(x.blockTime)}</span>
              <span>
                {x.side === "buy" ? "Bought" : "Sold"} {x.shares.toFixed(3)} {x.name}
              </span>
              <span>{usd(x.usd)}</span>
              <span style={{ color: x.vsShareUsd === null ? "var(--text-dim)" : x.vsShareUsd > 0 ? "var(--signal)" : "var(--success)" }}>
                {x.vsShareUsd === null ? "no price" : `${x.vsShareUsd > 0.005 ? "+" : ""}${usd(x.vsShareUsd)} (${pct(x.vsSharePct!)})`}
              </span>
            </a>
          ))}
        </div>
      )}

      <p className="wb-note">
        Read at {new Date(scan.readAt).toUTCString().replace(/ GMT$/, " UTC").replace(/^\w+, /, "")}. Nothing here is stored.
      </p>
    </div>
  );
}

const WB_CSS = `
.wb{animation:proof-arrive 320ms cubic-bezier(.23,1,.32,1)}
.wb-k{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px}
.wb-num{font-family:"JetBrains Mono",monospace;font-weight:600;font-size:clamp(52px,10vw,120px);line-height:1;min-height:1em;letter-spacing:-.02em;margin:6px 0 12px}
.wb-lede{font-family:Archivo,sans-serif;font-size:18px;line-height:1.45;color:var(--text-primary);margin:0;max-width:52ch}
.wb-note{font-family:"JetBrains Mono",monospace;font-size:12px;line-height:1.6;color:var(--text-dim);margin:14px 0 0;max-width:70ch}
.wb-hold,.wb-trades{margin-top:30px}
.wb-row{display:grid;grid-template-columns:1.4fr .9fr 1fr 1fr 1fr;gap:10px;padding:10px 0;border-top:1px solid var(--border);font-family:"JetBrains Mono",monospace;font-size:13px;color:var(--text-primary);font-variant-numeric:tabular-nums}
.wb-row.wb-t{grid-template-columns:.9fr 2fr 1fr 1.3fr}
.wb-head{border-top:none;color:var(--text-dim);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.wb-total{font-weight:600;border-top:2px solid var(--text-dim)}
.wb-link{text-decoration:none}
.wb-link:hover{background:rgba(255,255,255,.03)}
.wb-wait{padding:6px 0}
.wb-wait p{font-family:Archivo,sans-serif;font-size:15px;color:var(--text-muted);margin:0 0 14px}
.wb-bar{display:block;height:3px;border-radius:2px;background:var(--border);position:relative;overflow:hidden}
.wb-bar::after{content:"";position:absolute;inset:0;width:40%;background:var(--signal);transform:translateX(-100%);animation:wb-sweep 1.4s linear infinite}
.wb-refused{border:1px solid var(--signal);border-radius:4px;padding:16px;background:rgba(196,38,29,.06)}
.wb-refused p{font-family:"JetBrains Mono",monospace;font-size:13px;line-height:1.5;color:var(--text-primary);margin:0}
@keyframes wb-sweep{to{transform:translateX(250%)}}
@media (max-width:640px){.wb-row{grid-template-columns:1.2fr .8fr 1fr 1fr;font-size:12px}.wb-row>span:nth-child(3){display:none}.wb-row.wb-t{grid-template-columns:.9fr 1.8fr 1.2fr}.wb-row.wb-t>span:nth-child(3){display:none}}
@media (prefers-reduced-motion:reduce){.wb-bar::after{animation:none}}
`;
