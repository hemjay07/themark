"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getQuote, getSwapTransaction, fetchPrices, rateLimitedRecently, NoRouteError, getMintExtensions } from "@/lib/jupiter";
import { reconcileTransaction } from "@/lib/tx";
import { TOKEN_LIST, getTokenBySymbol, USDC_MINT, getToken, displayName } from "@/lib/tokens";
import type { ParsedExtension, QuoteResult } from "@/lib/types";
import TradeTicket from "@/components/TradeTicket";
import ControlsSection from "@/components/ControlsSection";
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

  useEffect(() => {
    const fetchQuote = async () => {
      setError("");
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
        if (q) {
          setQuote(q);
        } else {
          throw new Error("no quote returned");
        }
      } catch (err) {
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

  // the ticket's foot is the verdict; the action it leads to is step 4, beside the controls
  const foot = shouldRefuse && (quote || noRoute) ? (
    <div data-refusal className="tk-refusal">
      {noRoute || !quote
        ? "Not placed. No exchange can fill this order right now."
        : limitIsSet
          ? `Not placed. ${quote.fillCostPct.toFixed(2)}% is over your ${effectiveLimit.toFixed(2)}% limit.`
          : "Not placed. Set your limit in step 3."}
    </div>
  ) : quote ? (
    <div className="tk-ok">Within your {effectiveLimit.toFixed(2)}% limit</div>
  ) : null;

  const action = (
    <div className="v3-card v3-act" data-action>
      <div className="v3-act-label"><span className="step-n">4</span>place the order</div>
      {shouldRefuse && (quote || noRoute) ? (
        lead ? (
          <>
            <p className="v3-act-blocked">
              Blocked at this size. {usd0(lead)} of {displayName(selectedToken)} stays under your limit.
            </p>
            <button data-use-amount className="tk-place v3-lead" onClick={() => setAmount(String(lead))}>
              Use {usd0(lead)} instead
            </button>
          </>
        ) : (
          <p className="v3-act-blocked">
            Blocked. {noRoute ? "No exchange can fill it." : "It costs more than your limit."} Checking for a size that fits…
          </p>
        )
      ) : quote ? (
        <button onClick={connected ? handleSign : handleConnect} disabled={signing || settling} className="tk-place">
          {!connected ? "Connect a wallet to place this order" : signing ? "Signing…" : settling ? "Waiting for the chain…" : "Place this order"}
        </button>
      ) : (
        <p className="v3-act-blocked">Waiting for a live price.</p>
      )}
    </div>
  );

  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      {/* two columns at >= 1100px: the ticket on the left, what you set and what you can do instead
          on the right. On a phone: the ticket, the alternatives, then the controls (PRD-V3 R6). */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      <div className="v3-grid">
        <div className="v3-hero">
          <TradeTicket
            symbol={selectedToken}
            amountUsd={amountNum}
            limitPct={effectiveLimit}
            quote={quote}
            blocked={shouldRefuse}
            noRoute={noRoute}
            failed={Boolean(error) && !quote}
            mintExt={mintExt}
            routeNames={routeNames}
          >
            {foot}
          </TradeTicket>
        </div>

        <div className="v3-controls" data-controls>
          <div className="v3-card">
            <ControlsSection
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
              amount={amount}
              onAmountChange={handleAmountChange}
              onSliderChange={handleSliderChange}
              worstFillPct={worstFillPct}
              onLimitChange={setWorstFillPct}
              costByToken={quote ? { ...costByToken, [selectedToken]: quote.fillCostPct } : costByToken}
              blocked={shouldRefuse}
            />
            {error && <div className="v3-error">{error}</div>}
          </div>
        </div>

        <div className="v3-action">{action}</div>

        <div className="v3-advice">
          {/* no live price: no advice to give, so no empty card */}
          {!(error && !quote) && (
            <Advice
              symbol={selectedToken}
              amountUsd={amountNum}
              limitPct={effectiveLimit}
              blocked={shouldRefuse}
              noRoute={noRoute}
              quote={quote}
              costByToken={costByToken}
              onUseAmount={(n) => setAmount(String(n))}
              onLead={setLead}
            />
          )}
        </div>
      </div>

      <nav className="v3-also" aria-label="Also in THE MARK">
        {[
          { href: "/census", title: "Compare stocks", text: "Every stock at three order sizes, side by side." },
          { href: "/proof", title: "Verify a trade", text: "Paste any trade and see what it really cost." },
        ].map((l) => (
          <a key={l.href} href={l.href} className="v3-link">
            <span className="v3-link-t">{l.title} <span aria-hidden>→</span></span>
            <span className="v3-link-d">{l.text}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

const PAGE_CSS = `
.v3-grid{max-width:1240px;margin:0 auto;padding:48px 24px 40px;display:grid;gap:32px;
  grid-template-columns:1fr;grid-template-areas:"hero" "controls" "action" "advice"}
.v3-hero{grid-area:hero;min-width:0}.v3-action{grid-area:action;min-width:0}.v3-controls{grid-area:controls;min-width:0}.v3-advice{grid-area:advice;min-width:0}
@media (min-width:1100px){
  .v3-grid{grid-template-columns:minmax(0,1.25fr) minmax(0,0.95fr);column-gap:48px;row-gap:24px;
    grid-template-areas:"hero controls" "hero action" "hero advice";grid-template-rows:auto auto 1fr;align-items:start}
}
.v3-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:22px}
.v3-error{margin-top:16px;padding:12px 14px;border:1px solid var(--signal);border-radius:6px;
  background:rgba(196,38,29,.08);font-family:Archivo,sans-serif;font-size:14px;line-height:1.5}
.tk-refusal{font-family:Archivo,sans-serif;font-size:16px;font-weight:600;color:var(--signal);
  padding:14px 16px;border:2px solid var(--signal);border-radius:6px;animation:refuse-in 180ms cubic-bezier(.23,1,.32,1)}
.v3-act-label{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--text-dim);margin-bottom:12px;display:flex;align-items:center}
.v3-act .tk-place.v3-lead{margin-top:12px;text-transform:none;letter-spacing:0;font-size:16px;background:#3DBE74;color:#06140C;box-shadow:0 4px 0 #1E6B41}
.v3-act .tk-place{background:#F3EEE2;color:#17140F;box-shadow:0 4px 0 #8C8676}
.v3-act .tk-place:hover{box-shadow:0 5px 0 #8C8676}.v3-act .tk-place:active{box-shadow:0 1px 0 #8C8676}
.v3-act-blocked{font-family:Archivo,sans-serif;font-size:15px;line-height:1.5;color:var(--text-muted);margin:0}
.tk-ok{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--success);margin-bottom:10px}
.tk-place{width:100%;padding:16px;border-radius:6px;border:none;background:#17140F;color:#F3EEE2;
  font-family:Archivo,sans-serif;font-size:14px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  cursor:pointer;transition:transform 120ms ease-out,box-shadow 160ms ease-out;box-shadow:0 4px 0 #000}
.tk-place:hover{transform:translateY(-1px);box-shadow:0 5px 0 #000}
.tk-place:active{transform:translateY(3px);box-shadow:0 1px 0 #000}
.tk-place:disabled{opacity:.6;cursor:wait}
.v3-also{max-width:1240px;margin:0 auto;padding:8px 24px 72px;display:grid;gap:14px;
  grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.v3-link{display:block;text-decoration:none;padding:18px 20px;border:1px solid var(--border);border-radius:10px;
  transition:border-color 160ms ease-out,transform 160ms ease-out}
.v3-link:hover{border-color:var(--text-dim);transform:translateY(-2px)}
.v3-link-t{display:block;font-family:Archivo,sans-serif;font-size:16px;font-weight:500;color:var(--text-primary);margin-bottom:4px}
.v3-link-d{display:block;font-family:Archivo,sans-serif;font-size:14px;color:var(--text-muted)}
@media (prefers-reduced-motion:reduce){.tk-refusal{animation:none}}
`;
