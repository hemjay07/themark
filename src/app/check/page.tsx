"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getQuote, getSwapTransaction, fetchPrices, rateLimitedRecently, NoRouteError, getMintExtensions } from "@/lib/jupiter";
import { reconcileTransaction } from "@/lib/tx";
import { TOKEN_LIST, getTokenBySymbol, USDC_MINT, getToken, displayName } from "@/lib/tokens";
import type { ParsedExtension, QuoteResult } from "@/lib/types";
import TradeTicket, { type TicketHandle } from "@/components/TradeTicket";
import Sparkline from "@/components/Sparkline";
import TicketControls from "@/components/TicketControls";
import Advice from "@/components/Advice";

const usd0 = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default function Home() {
  const [amount, setAmount] = useState("25000");
  const [selectedToken, setSelectedToken] = useState("tOpenAI");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const router = useRouter();
  const [worstFillPct, setWorstFillPct] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [signing, setSigning] = useState(false);
  const [settling, setSettling] = useState(false);
  // the size the advice found that passes, offered again where the order is placed
  const [lead, setLead] = useState<number | null>(null);
  const [searching, setSearching] = useState(true);
  // the cut: the ticket tears when the order is cut to a size that fits (design/CREATIVE.md, 1)
  const ticketRef = useRef<TicketHandle>(null);
  const useAmount = (n: number) => {
    ticketRef.current?.cut();
    setAmount(String(n));
  };
  // watch the line: a blocked ticket re-quotes every 30 s until it clears (device 2)
  const [watching, setWatching] = useState(false);
  const [readings, setReadings] = useState<{ t: number; pct: number }[]>([]);
  // when the next check is due, and what a finished watch found
  const [nextAt, setNextAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [watchResult, setWatchResult] = useState<{ at: number; checks: number; pct: number } | null>(null);
  const [notify, setNotify] = useState<"granted" | "denied" | "default" | "none">("none");
  const [copied, setCopied] = useState(false);
  const [costByToken, setCostByToken] = useState<Record<string, number | null>>({});
  // no exchange can fill this size right now: a finding, shown as one (PRD-V3 R2b)
  const [noRoute, setNoRoute] = useState(false);
  // the selected token's own extensions, read independently of any quote, so the issuer powers show
  // even when no exchange can fill the order (undefined = still reading, null = read failed)
  const [mintExt, setMintExt] = useState<ParsedExtension[] | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    setMintExt(undefined);
    const mint = getTokenBySymbol(selectedToken)?.mint;
    if (!mint) return;
    getMintExtensions(mint).then((e) => {
      if (!cancelled) setMintExt(e);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedToken]);

  useEffect(() => {
    const checkConnection = async () => {
      if (!(window as any)?.solana?.isPhantom) return;
      try {
        const response = await (window as any).solana.connect({ onlyIfTrusted: true });
        setConnected(true);
      } catch {
        // Not connected
      }
    };
    checkConnection();
    // the top bar's wallet button connects too; it announces it so this page knows
    const onWallet = () => setConnected(true);
    window.addEventListener("mark:wallet", onWallet);
    return () => window.removeEventListener("mark:wallet", onWallet);
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  // each request is numbered; an answer to an earlier order is thrown away
  const reqId = useRef(0);
  useEffect(() => {
    const fetchQuote = async () => {
      setError("");
      // the ticket never shows the previous order's figures under the new order's name
      setQuote(null);
      setCostByToken({});
      const mine = ++reqId.current;
      const amountNum = parseFloat(amount);
      if (!amountNum || amountNum < 10 || amountNum > 25000) {
        // Leaving the previous quote up would put a remembered number on the surface for an
        // order the reader is not making. (charter ban 1)
        setQuote(null);
        setError(
          amount.trim() === ""
            ? "Enter an amount between $10 and $25,000 and this reads the pool live."
            : "That amount is outside the range this quotes ($10 to $25,000), so there is nothing to show."
        );
        return;
      }

      const token = getTokenBySymbol(selectedToken);
      if (!token) {
        setQuote(null);
        setError("No such token in this list, so there is nothing to quote.");
        return;
      }

      setLoading(true);
      try {
        const amountInLamports = String(Math.floor(amountNum * 1e6));
        // The line the reader sets is the transaction's own guard, not just a render condition.
        // It was hardcoded at 50 bps, so a reader who set 0.10% signed a route that would fill
        // five times worse than the line the surface asked them for.
        const limit = Number.isFinite(worstFillPct) ? worstFillPct : 0;
        const slippageBps = Math.max(1, Math.min(5000, Math.round(limit * 100)));
        setNoRoute(false);
        const q = await getQuote(USDC_MINT, token.mint, amountInLamports, slippageBps);
        if (mine !== reqId.current) return;
        if (q) {
          setQuote(q);
        } else {
          throw new Error("no quote returned");
        }
      } catch (err) {
        if (mine !== reqId.current) return;
        if (err instanceof NoRouteError) {
          // not a failure of the app: the market cannot take an order this size right now
          setQuote(null);
          setNoRoute(true);
          return;
        }
        // A guard that guesses is worse than no guard. If the quote cannot be read, this shows nothing and
        // says why; it never substitutes a remembered number for a live one. (charter ban 1)
        console.error("Quote failed:", err);
        setQuote(null);
        setError(
          rateLimitedRecently()
            ? "Jupiter is rate-limiting this address right now, so there is no live price to show. It clears in under a minute."
            : "No live quote right now, so there is nothing to show. This screen never fills the gap with a remembered price."
        );
      } finally {
        setLoading(false);
      }
    };

    // One debounce for every run, including the first: the previous shape fired once immediately
    // AND again through the effect that `initialized` re-triggered, doubling every fold's calls.
    const timer = setTimeout(fetchQuote, initialized ? 300 : 0);
    setInitialized(true);
    return () => clearTimeout(timer);
  }, [amount, selectedToken, worstFillPct]); // eslint-disable-line react-hooks/exhaustive-deps

  // any change to the order ends the watch: it was watching a different ticket
  useEffect(() => {
    setWatching(false);
    setReadings([]);
    setWatchResult(null);
  }, [selectedToken, amount, worstFillPct]);
  // a one-second tick for the countdown, only while watching
  useEffect(() => {
    if (!watching) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [watching]);
  useEffect(() => {
    if (typeof Notification !== "undefined") setNotify(Notification.permission);
  }, [watching]);
  // the tab says what the ticket is doing
  useEffect(() => {
    if (watching) document.title = "Watching the line · THE MARK";
    else if (watchResult) document.title = "Cleared · THE MARK";
    else document.title = "THE MARK";
    return () => {
      document.title = "THE MARK";
    };
  }, [watching, watchResult]);

  useEffect(() => {
    if (!watching) return;
    const token = getTokenBySymbol(selectedToken);
    const amt = parseFloat(amount);
    const limit = Number.isFinite(worstFillPct) ? worstFillPct : 0;
    if (!token || !(amt >= 10)) {
      setWatching(false);
      return;
    }
    let cancelled = false;
    let checks = 0;
    const bps = Math.max(1, Math.min(5000, Math.round(limit * 100)));
    const read = async () => {
      setNextAt(Date.now() + 30_000);
      try {
        const q = await getQuote(USDC_MINT, token.mint, String(Math.floor(amt * 1e6)), bps, { advice: true });
        if (cancelled || !q) return;
        checks += 1;
        setReadings((r) => [...r.slice(-59), { t: Date.now(), pct: q.fillCostPct }]);
        // the ticket shows the latest reading, so its figure and "lowest" agree
        setQuote(q);
        setNoRoute(false);
        if (q.fillCostPct <= limit) {
          setWatchResult({ at: Date.now(), checks, pct: q.fillCostPct });
          setWatching(false);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("THE MARK: your order clears", {
              body: `${usd0(amt)} of ${displayName(selectedToken)} now costs ${q.fillCostPct.toFixed(2)}%, under your ${limit.toFixed(2)}% limit.`,
            });
          }
        }
      } catch {
        // a failed reading is skipped; the next one comes in 30 s
      }
    };
    read();
    const id = setInterval(read, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watching]);

  const startWatching = () => {
    setReadings([]);
    setWatchResult(null);
    setWatching(true);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().then((p) => setNotify(p));
    }
  };
  const secsToNext = nextAt ? Math.max(0, Math.round((nextAt - Date.now()) / 1000)) : null;
  void tick;

  // a ticket is a link: its stock, amount and limit live in the URL (device 8)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const stock = sp.get("stock");
    const amt = sp.get("amount");
    const lim = sp.get("limit");
    const t = stock ? TOKEN_LIST.find((x) => x.symbol.toLowerCase() === stock.toLowerCase() || displayName(x.symbol).toLowerCase() === stock.toLowerCase()) : undefined;
    if (t) setSelectedToken(t.symbol);
    if (amt && /^\d+(\.\d+)?$/.test(amt)) setAmount(amt);
    if (lim && /^\d+(\.\d+)?$/.test(lim)) setWorstFillPct(parseFloat(lim));
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams();
      sp.set("stock", displayName(selectedToken));
      sp.set("amount", amount);
      if (Number.isFinite(worstFillPct)) sp.set("limit", String(worstFillPct));
      window.history.replaceState(null, "", `/check?${sp}`);
    }, 400);
    return () => clearTimeout(t);
  }, [selectedToken, amount, worstFillPct]);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // the clipboard was refused: the address bar still has the link
    }
  };

  // A blank "worst fill" field yields NaN, and every comparison against NaN is false, which
  // silently removed the only guard in the product. An unreadable line is treated as the
  // tightest line, so the guard fails closed.
  const limitIsSet = Number.isFinite(worstFillPct);
  const effectiveLimit = limitIsSet ? worstFillPct : 0;
  const shouldRefuse = noRoute || Boolean(quote && quote.fillCostPct > effectiveLimit);
  const amountNum = parseFloat(amount) || 5000;
  const fillPercent = ((amountNum - 10) / (25000 - 10)) * 100;

  const handleSign = async () => {
    if (!quote || shouldRefuse) return;

    const phantom = (window as any)?.solana;
    if (!phantom?.isConnected || !phantom.publicKey) {
      setError("Connect a wallet before signing.");
      return;
    }

    setSigning(true);
    setError("");
    try {
      const swapTx = await getSwapTransaction(quote.raw, phantom.publicKey.toString());
      if (!swapTx) throw new Error("the swap could not be built");

      // Loaded only when someone actually signs, so the fold stays inside the charter's byte budget.
      const { VersionedTransaction } = await import("@solana/web3.js");
      const binary = atob(swapTx);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

      // Phantom signs and sends; the signature below is the one the cluster returned.
      const { signature } = await phantom.signAndSendTransaction(
        VersionedTransaction.deserialize(bytes)
      );

      // signAndSendTransaction resolves on SUBMISSION, not on landing. A transaction that hits
      // its slippage limit, gets dropped or reverts still returns a signature here. So the
      // receipt is not built from the quote's prediction: the chain is polled until the
      // transaction is readable, and every figure below is decoded from what actually moved.
      setSigning(false);
      setSettling(true);
      let landed: Awaited<ReturnType<typeof reconcileTransaction>> | null = null;
      let lastErr = "";
      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise((r) => setTimeout(r, 1500));
        try {
          landed = await reconcileTransaction(signature);
          break;
        } catch (e) {
          lastErr = e instanceof Error ? e.message : String(e);
        }
      }
      if (!landed) {
        setError(
          `Signed as ${signature.slice(0, 8)}…, but the chain has not returned a readable result yet, ` +
            `so there is no receipt to show. ${lastErr}`
        );
        return;
      }

      // The trade landed. Its receipt is the proof page for this signature: every figure read off
      // the chain, and a link the person can keep or share.
      router.push(`/proof?sig=${landed.signature}`);
    } catch (err) {
      // No receipt is ever shown for a transaction that did not land. (charter ban 1)
      console.error("Sign failed:", err);
      setError("The transaction did not go through, so there is no receipt to show.");
    } finally {
      setSigning(false);
      setSettling(false);
    }
  };

  // Every stock priced at the amount you typed, so the selector itself shows the spread.
  // This is deliberately slow and polite: the free Jupiter endpoint throttles hard, and a burst
  // of eight quotes was starving the one quote this page actually needs. One price call covers
  // every token, then the mints are read one at a time with a gap, and the selected token is
  // skipped because the main quote already has it.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const amt = parseFloat(amount);
      if (!amt || amt < 10 || amt > 25000) return;
      const lamports = String(Math.floor(amt * 1e6));
      const limit = Number.isFinite(worstFillPct) ? worstFillPct : 0;
      const bps = Math.max(1, Math.min(5000, Math.round(limit * 100)));

      // At a size the census measures, its shared reading (two minutes old at most, same measure)
      // fills the chips without eight more quotes on a one-request-a-second key. Only the stocks it
      // could not read are quoted here.
      let todo = TOKEN_LIST;
      if (["500", "5000", "25000"].includes(String(amt))) {
        try {
          const census = await fetch("/api/census").then((r) => (r.ok ? r.json() : null));
          if (cancelled) return;
          const read: Record<string, number> = {};
          for (const t of TOKEN_LIST) {
            const cell = census?.cells?.[t.mint]?.[String(amt)];
            if (cell?.ok && typeof cell.pct === "number") read[t.symbol] = cell.pct;
          }
          setCostByToken((prev) => ({ ...prev, ...read }));
          todo = TOKEN_LIST.filter((t) => !(t.symbol in read));
        } catch {
          // the census could not be read: quote every stock instead
        }
      }
      if (!todo.length) return;

      const prices = await fetchPrices(todo.map((t) => t.mint), true);
      if (cancelled) return;

      for (const t of todo) {
        if (cancelled) return;
        try {
          const q = await getQuote(USDC_MINT, t.mint, lamports, bps, { price: prices[t.mint], background: true });
          if (!cancelled) setCostByToken((prev) => ({ ...prev, [t.symbol]: q ? q.fillCostPct : null }));
        } catch {
          if (!cancelled) setCostByToken((prev) => ({ ...prev, [t.symbol]: null }));
        }
        await new Promise((r) => setTimeout(r, 320));
      }
    };
    // long enough after mount that the page's own quote goes first
    const timer = setTimeout(run, 2200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amount, worstFillPct]);

  const handleConnect = async () => {
    const phantom = (window as any)?.solana;
    if (!phantom) {
      setError("No Solana wallet found in this browser.");
      return;
    }

    try {
      await phantom.connect();
      setConnected(true);
      window.dispatchEvent(new Event("mark:wallet"));
      setError("");
    } catch (err) {
      console.error("Connect failed:", err);
      setError("The wallet did not connect.");
    }
  };

  const routeNames = (() => {
    const plan = (quote?.raw as any)?.routePlan;
    if (!Array.isArray(plan)) return [];
    const names = plan.map((l: any) => String(l?.swapInfo?.label ?? "").replace(/\s+(CLMM|CPMM|AMM|DLMM|V\d+)$/i, "").trim()).filter(Boolean);
    return [...new Set(names)] as string[];
  })();

  // the ticket's foot: the verdict, and what to do about it (PRD-V5). Blocked: the cut and the watch.
  // Clears: the order button.
  const foot = shouldRefuse && (quote || noRoute) ? (
    <>
      <div data-refusal className="tk-refusal">
        {noRoute || !quote
          ? "Not placed. No exchange can fill this order right now."
          : limitIsSet
            ? `Not placed. ${quote.fillCostPct - effectiveLimit < 0.005 ? "Under 0.01" : (quote.fillCostPct - effectiveLimit).toFixed(2)} points over your line.`
            : "Not placed. Type your limit on the line."}
      </div>
      {quote && (
        <p className="tk-why">
          {lead
            ? `Cut it down to ${usd0(lead)}, the largest size that fits under your line, or leave the ticket to watch the line until it clears.`
            : searching
              ? "Looking for the largest size that fits under your line."
              : "No smaller size fits under your line right now. Watch the line, or raise it."}
        </p>
      )}
      <div className="tk-actions">
        {lead ? (
          <button data-use-amount className="tk-place tk-cut" onClick={() => useAmount(lead)}>
            Cut to {usd0(lead)} <span aria-hidden>→</span>
          </button>
        ) : null}
        {quote && !watching && (
          <button className="tk-ghost" onClick={startWatching}>
            Watch the line
          </button>
        )}
      </div>
      {watching && quote && (
        <div className="tk-watch" data-watch>
          <div className="tk-watch-h">
            <span className="tk-watch-k">Watching the line</span>
            <span className="tk-watch-next">{secsToNext === null ? "reading now" : secsToNext === 0 ? "reading now" : `next check in ${secsToNext}s`}</span>
          </div>
          <p className="tk-watch-p">
            Every 30 seconds THE MARK re-quotes this exact order, {usd0(amountNum)} of {displayName(selectedToken)}. The moment it fits under your{" "}
            {effectiveLimit.toFixed(2)}% line, the ticket clears{notify === "granted" ? " and you get a browser notification" : ""}, and you can place it.
            {readings.length ? ` Checked ${readings.length} time${readings.length === 1 ? "" : "s"} so far.` : ""}
          </p>
          <Sparkline readings={readings} limit={effectiveLimit} />
          <div className="tk-watch-foot">
            <button className="tk-ghost" onClick={() => setWatching(false)}>
              Stop watching
            </button>
            <span className="tk-watch-note">
              {notify === "granted"
                ? "Notifications on. Leave this tab open."
                : notify === "denied"
                  ? "Notifications are blocked in this browser, so keep this tab in view."
                  : "Allow notifications to be told when it clears, or keep this tab in view."}
            </span>
          </div>
        </div>
      )}
    </>
  ) : quote ? (
    <>
      <div className="tk-ok">
        Within your line{limitIsSet ? ` at ${effectiveLimit.toFixed(2)}%` : ""}.
        {watchResult ? ` Cleared at ${new Date(watchResult.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, after ${watchResult.checks} check${watchResult.checks === 1 ? "" : "s"}, at ${watchResult.pct.toFixed(2)}%.` : ""}
      </div>
      <button onClick={connected ? handleSign : handleConnect} disabled={signing || settling} className="tk-place">
        {!connected ? "Connect a wallet to place this order" : signing ? "Signing…" : settling ? "Waiting for the chain…" : "Place this order"}
      </button>
    </>
  ) : null;

  return (
    <div className="ck">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="ck-grid">
        <div className="ck-main">
          <TradeTicket
            ref={ticketRef}
            symbol={selectedToken}
            amountUsd={amountNum}
            limitPct={effectiveLimit}
            quote={quote}
            blocked={shouldRefuse}
            noRoute={noRoute}
            failed={Boolean(error) && !quote}
            mintExt={mintExt}
            routeNames={routeNames}
            onLimitChange={setWorstFillPct}
            watching={watching}
            controls={
              <TicketControls
                selected={selectedToken}
                onSelect={setSelectedToken}
                costByToken={quote ? { ...costByToken, [selectedToken]: quote.fillCostPct } : costByToken}
                limit={effectiveLimit}
                amount={amount}
                onAmount={handleAmountChange}
                onSlider={handleSliderChange}
              />
            }
          >
            {foot}
          </TradeTicket>
          {quote && (
            <button className="ck-copy" onClick={copyLink}>
              {copied ? "Link copied" : "Copy a link to this ticket"}
            </button>
          )}
          {error && <div className="v3-error">{error}</div>}
        </div>
        <aside className="ck-side">
          {/* no live price: no advice to give, so no empty stubs */}
          {!(error && !quote) && (
            <Advice
              symbol={selectedToken}
              amountUsd={amountNum}
              limitPct={effectiveLimit}
              blocked={shouldRefuse}
              noRoute={noRoute}
              quote={quote}
              costByToken={costByToken}
              onUseAmount={useAmount}
              onLead={(n) => {
                // during a watch each reading re-runs the search; the last size that fit stays on the ticket
                if (n !== null || !watching) setLead(n);
              }}
              onSearching={setSearching}
              stubs
            />
          )}
        </aside>
      </div>
    </div>
  );
}

const PAGE_CSS = `
.ck{padding:28px 20px 72px}
.ck-grid{max-width:1120px;margin:0 auto;display:grid;gap:28px;grid-template-columns:1fr;align-items:start}
@media (min-width:1000px){.ck-grid{grid-template-columns:minmax(0,760px) 300px;justify-content:center;gap:36px}.ck-side{position:sticky;top:84px;padding-top:12px}}
.ck-main{min-width:0}
.ck-copy{display:block;margin:12px auto 0;background:none;border:none;padding:0;color:var(--text-dim);font-family:Archivo,sans-serif;font-size:13px;
  text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.v3-error{margin-top:16px;padding:12px 14px;border:1px solid var(--signal);border-radius:6px;
  background:rgba(196,38,29,.08);font-family:Archivo,sans-serif;font-size:14px;line-height:1.5}
.tk-refusal{font-family:Archivo,sans-serif;font-size:16px;font-weight:600;color:var(--signal);margin-bottom:12px;animation:refuse-in 180ms cubic-bezier(.23,1,.32,1)}
.tk-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.tk-ok{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--success);margin-bottom:10px}
.tk-place{padding:14px 18px;border-radius:6px;border:none;background:#17140F;color:#F3EEE2;
  font-family:Archivo,sans-serif;font-size:15px;font-weight:700;letter-spacing:0;cursor:pointer;
  transition:transform 120ms ease-out,box-shadow 160ms ease-out;box-shadow:0 4px 0 #000}
.tk-place:hover{transform:translateY(-1px);box-shadow:0 5px 0 #000}
.tk-place:active{transform:translateY(3px);box-shadow:0 1px 0 #000}
.tk-place:disabled{opacity:.6;cursor:wait}
.tk-place:not(.tk-cut){width:100%}
.tk-cut{background:#0B7A3B;box-shadow:0 4px 0 #064d24}
.tk-cut:hover{box-shadow:0 5px 0 #064d24}
.tk-cut span{display:inline-block;transition:transform .16s ease-out}
.tk-cut:hover span{transform:translateX(3px)}
.tk-ghost{padding:13px 16px;border-radius:6px;border:1.5px solid #17140F;background:transparent;color:#17140F;
  font-family:Archivo,sans-serif;font-size:14px;font-weight:600;cursor:pointer}
.tk-ghost:hover{background:rgba(23,20,15,.06)}
.tk-why{font-family:Archivo,sans-serif;font-size:14px;line-height:1.5;color:var(--text-muted);margin:0 0 12px;max-width:56ch}
.tk-watch{margin-top:14px;padding-top:14px;border-top:2px dashed var(--border)}
.tk-watch-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.tk-watch-k{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-primary);font-weight:600}
.tk-watch-k::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--signal);margin-right:8px;vertical-align:middle;animation:watch-pulse 1.4s ease-in-out infinite}
.tk-watch-next{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim);font-variant-numeric:tabular-nums}
.tk-watch-p{font-family:Archivo,sans-serif;font-size:14px;line-height:1.5;color:var(--text-muted);margin:8px 0 0;max-width:60ch}
.tk-watch-foot{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:6px}
.tk-watch-note{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--text-dim)}
@keyframes watch-pulse{0%,100%{opacity:.35}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.tk-watch-k::before{animation:none}}
@media (prefers-reduced-motion:reduce){.tk-refusal{animation:none}}
`;
