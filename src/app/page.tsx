"use client";

import { useState, useEffect } from "react";
import { getQuote, getSwapTransaction, fetchPrices, rateLimitedRecently, NoRouteError, getMintExtensions } from "@/lib/jupiter";
import { reconcileTransaction } from "@/lib/tx";
import { TOKEN_LIST, getTokenBySymbol, USDC_MINT, getToken } from "@/lib/tokens";
import type { ParsedExtension, QuoteResult, Receipt as ReceiptType } from "@/lib/types";
import Odometer from "@/components/Odometer";
import HeroSection from "@/components/HeroSection";
import ControlsSection from "@/components/ControlsSection";
import KeptVsLost from "@/components/KeptVsLost";
import Advice from "@/components/Advice";
import IssuerSummary from "@/components/IssuerSummary";
import PoolDrain from "@/components/PoolDrain";

export default function Home() {
  const [amount, setAmount] = useState("2000");
  const [selectedToken, setSelectedToken] = useState("PLTRx");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [worstFillPct, setWorstFillPct] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [signing, setSigning] = useState(false);
  const [settling, setSettling] = useState(false);
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

      setReceipt({
        txSignature: landed.signature,
        amountInUsdc: landed.usdcSpent,
        amountOutTokens: landed.tokenReceived,
        filledPrice: landed.effectivePrice,
        referencePrice: landed.referencePrice,
        costAboveReference: landed.vsShareUsd,
        costAboveReferencePct: landed.vsSharePct,
        savedVsWorstCase: ((effectiveLimit - quote.fillCostPct) * landed.usdcSpent) / 100,
        solscanLink: `https://solscan.io/tx/${landed.signature}`,
        timestamp: landed.blockTime
          ? new Date(landed.blockTime * 1000).toISOString()
          : new Date().toISOString(),
        tokenSymbol: landed.tokenSymbol,
        multiplier: quote.multiplier,
        transferFeePercentage: quote.transferFeePercentage,
      });
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

      const prices = await fetchPrices(TOKEN_LIST.map((t) => t.mint), true);
      if (cancelled) return;

      for (const t of TOKEN_LIST) {
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
      setError("");
    } catch (err) {
      console.error("Connect failed:", err);
      setError("The wallet did not connect.");
    }
  };

  // allInCostPct is ALREADY measured against the share: it is
  // (paid - unitsReceived x sharePrice) / paid. Deducting the token/share basis a second time
  // inverted the sign and made the fold claim a discount while the axis above it showed a cost.
  const netPercent = quote ? quote.allInCostPct : 0;
  const isBelow = netPercent < 0;

  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "20px",
  };
  const routeNames = (() => {
    const plan = (quote?.raw as any)?.routePlan;
    if (!Array.isArray(plan)) return [];
    const names = plan.map((l: any) => String(l?.swapInfo?.label ?? "").replace(/\s+(CLMM|CPMM|AMM|DLMM|V\d+)$/i, "").trim()).filter(Boolean);
    return [...new Set(names)] as string[];
  })();
  const joinNames = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      {/* two columns at >= 1100px, one below (PRD-V3 R6). dangerouslySetInnerHTML so React never
          escapes the ">" in a selector between server and client. */}
      <style dangerouslySetInnerHTML={{ __html: `
        .v3-grid{max-width:1240px;margin:0 auto;padding:56px 24px 40px;display:grid;gap:40px;
          grid-template-columns:1fr;grid-template-areas:"hero" "controls" "advice"}
        .v3-hero{grid-area:hero}.v3-controls{grid-area:controls}.v3-advice{grid-area:advice}
        @media (min-width:1100px){
          .v3-grid{grid-template-columns:minmax(0,1.35fr) minmax(0,0.9fr);column-gap:56px;
            grid-template-areas:"hero controls" "advice controls";align-items:start}
          .v3-controls{position:sticky;top:24px}
        }
        .v3-below{max-width:1240px;margin:0 auto;padding:8px 24px 72px;display:grid;gap:20px;
          grid-template-columns:1fr}
        @media (min-width:1100px){ .v3-below{grid-template-columns:1fr 1fr} }
      ` }} />

      <div className="v3-grid">
        <div className="v3-hero">
          <HeroSection
            costUsd={quote?.fillCostUsd ?? 0}
            limitPct={effectiveLimit}
            fillPct={quote?.fillCostPct ?? 0}
            amountUsd={amountNum}
            isBlocked={shouldRefuse}
            noRoute={noRoute}
            selectedStock={selectedToken}
            hasQuote={Boolean(quote)}
          />
        </div>

        <div className="v3-controls" data-controls>
          <div style={card}>
            <ControlsSection
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
              amount={amount}
              onAmountChange={handleAmountChange}
              onSliderChange={handleSliderChange}
              worstFillPct={worstFillPct}
              onLimitChange={setWorstFillPct}
              costByToken={quote ? { ...costByToken, [selectedToken]: quote.fillCostPct } : costByToken}
            />

            {error && (
              <div style={{ marginTop: "16px", padding: "12px 14px", border: "1px solid var(--signal)", borderRadius: "6px", background: "rgba(196, 38, 29, 0.06)", fontFamily: "Archivo, sans-serif", fontSize: "14px", lineHeight: 1.5, color: "var(--text-primary)" }}>
                {error}
              </div>
            )}

            {shouldRefuse && (quote || noRoute) ? (
              <div
                data-refusal
                style={{ marginTop: "18px", padding: "14px 16px", border: "1px solid var(--signal)", borderRadius: "6px", background: "rgba(196, 38, 29, 0.08)", animation: "refuse-in 180ms cubic-bezier(0.23, 1, 0.32, 1)" }}
              >
                <div style={{ fontFamily: "Archivo, sans-serif", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal)", marginBottom: "6px" }}>
                  Blocked
                </div>
                <div style={{ fontFamily: "Archivo, sans-serif", fontSize: "14px", lineHeight: 1.5, color: "var(--text-primary)" }}>
                  {noRoute || !quote ? (
                    "No exchange can fill this order right now, so there is nothing to place."
                  ) : (
                    <>
                      This order costs <Odometer value={quote.fillCostUsd} prefix="$" style={{ color: "var(--signal)" }} /> extra,{" "}
                      <Odometer value={quote.fillCostPct} suffix="%" style={{ color: "var(--signal)" }} /> of what you spend. Your limit is{" "}
                      {limitIsSet ? `${effectiveLimit.toFixed(2)}%` : "unset, so everything is blocked"}.
                    </>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={connected ? handleSign : handleConnect}
                disabled={signing || settling || (connected && !quote)}
                style={{
                  width: "100%",
                  marginTop: "18px",
                  padding: "16px",
                  background: "var(--text-primary)",
                  border: "1px solid var(--text-primary)",
                  color: "var(--bg)",
                  fontFamily: "Archivo, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  cursor: signing || (connected && !quote) ? "not-allowed" : "pointer",
                  borderRadius: "6px",
                }}
              >
                {!connected ? "Connect a wallet to place this order" : signing ? "Signing…" : settling ? "Waiting for the chain…" : "Place this order"}
              </button>
            )}
          </div>
        </div>

        <div className="v3-advice">
          <Advice
            symbol={selectedToken}
            amountUsd={amountNum}
            limitPct={effectiveLimit}
            blocked={shouldRefuse}
            noRoute={noRoute}
            quote={quote}
            costByToken={costByToken}
          />
          <IssuerSummary symbol={selectedToken} extensions={mintExt} loading={mintExt === undefined} />
        </div>
      </div>

      <div className="v3-below">
        {quote && (
          <div style={card} data-kept>
            <KeptVsLost amountInUsd={quote.amountInUsd} costUsd={quote.fillCostUsd} />
          </div>
        )}
        {quote && (
          <div style={card}>
            <PoolDrain amountUsd={amountNum} liquidityUsd={quote.liquidityUsd} refusing={Boolean(shouldRefuse)} />
            <p data-route style={{ fontFamily: "Archivo, sans-serif", fontSize: "14px", lineHeight: 1.5, color: "var(--text-muted)", margin: "14px 0 0" }}>
              {routeNames.length
                ? `Your order fills through ${joinNames(routeNames)}.`
                : "Where this order fills is shown once it is quoted."}
            </p>
          </div>
        )}

        <div style={{ gridColumn: "1 / -1", marginTop: "24px" }}>
          <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: "18px", fontWeight: 500, color: "var(--text-primary)", margin: "0 0 14px" }}>
            Also in THE MARK
          </h2>
          <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {[
              { href: "/census", title: "Compare stocks", text: "Every stock priced at three order sizes, side by side, so you can see which ones cost you the most." },
              { href: "/proof", title: "Verify a trade", text: "Paste the receipt of any trade and see what it really cost, read off the public record." },
            ].map((l) => (
              <a key={l.href} href={l.href} style={{ ...card, display: "block", textDecoration: "none" }}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontSize: "16px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>{l.title}</div>
                <div style={{ fontFamily: "Archivo, sans-serif", fontSize: "14px", lineHeight: 1.5, color: "var(--text-muted)" }}>{l.text}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
