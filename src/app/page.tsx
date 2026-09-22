"use client";

import { useState, useEffect } from "react";
import { getQuote, getSwapTransaction, fetchPrices, rateLimitedRecently } from "@/lib/jupiter";
import { reconcileTransaction } from "@/lib/tx";
import { TOKEN_LIST, getTokenBySymbol, USDC_MINT, getToken } from "@/lib/tokens";
import type { QuoteResult, Receipt as ReceiptType } from "@/lib/types";
import PoolHero from "@/components/PoolHero";
import Odometer from "@/components/Odometer";
import HeroSection from "@/components/HeroSection";
import ControlsSection from "@/components/ControlsSection";
import KeptVsLost from "@/components/KeptVsLost";
import RouteBreakdown from "@/components/RouteBreakdown";
import IssuerControlBadges from "@/components/IssuerControlBadges";
import PoolDrain from "@/components/PoolDrain";

export default function Home() {
  const [amount, setAmount] = useState("5000");
  const [selectedToken, setSelectedToken] = useState("INTCx");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [worstFillPct, setWorstFillPct] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [signing, setSigning] = useState(false);
  const [settling, setSettling] = useState(false);
  const [costByToken, setCostByToken] = useState<Record<string, number | null>>({});

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
        const q = await getQuote(USDC_MINT, token.mint, amountInLamports, slippageBps);
        if (q) {
          setQuote(q);
        } else {
          throw new Error("no quote returned");
        }
      } catch (err) {
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
  const shouldRefuse = Boolean(quote && quote.fillCostPct > effectiveLimit);
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

      const prices = await fetchPrices(TOKEN_LIST.map((t) => t.mint));
      if (cancelled) return;

      for (const t of TOKEN_LIST) {
        if (cancelled) return;
        try {
          const q = await getQuote(USDC_MINT, t.mint, lamports, bps, { price: prices[t.mint] });
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

  return (
    <PoolHero
      orderShare={quote && quote.liquidityUsd > 0 ? amountNum / quote.liquidityUsd : 0}
      fillPct={quote?.fillCostPct ?? 0}
      limitPct={effectiveLimit}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", minHeight: "100vh" }}>
        {/* Hero section: cost number + limit line */}
        <HeroSection
          costUsd={quote?.fillCostUsd ?? 0}
          costPct={quote?.fillCostPct ?? 0}
          limitPct={effectiveLimit}
          fillPct={quote?.fillCostPct ?? 0}
          amountUsd={amountNum}
          isBlocked={shouldRefuse}
          selectedStock={selectedToken}
          hasQuote={Boolean(quote)}
        />

        {/* Controls section: stock chips, amount slider, limit input */}
        <ControlsSection
          selectedToken={selectedToken}
          onSelectToken={setSelectedToken}
          amount={amount}
          onAmountChange={handleAmountChange}
          onSliderChange={handleSliderChange}
          worstFillPct={worstFillPct}
          onLimitChange={setWorstFillPct}
          costByToken={costByToken}
        />

        {/* Error message display */}
        {error && (
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              margin: "0 auto 32px",
              padding: "16px 24px",
              background: "rgba(196, 38, 29, 0.06)",
              border: "1px solid var(--signal)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              fontFamily: '"Archivo", sans-serif',
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Refusal state */}
        {shouldRefuse && quote && (
          <div
            data-refusal
            style={{
              width: "100%",
              maxWidth: "800px",
              margin: "0 auto 32px",
              padding: "20px 24px",
              border: "1px solid var(--signal)",
              borderRadius: "6px",
              background: "rgba(196, 38, 29, 0.06)",
              animation: "refuse-in 180ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            <div
              style={{
                fontFamily: '"Archivo", sans-serif',
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--signal)",
                marginBottom: "10px",
              }}
            >
              Blocked
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: "13px",
                color: "var(--text-primary)",
                lineHeight: 1.5,
              }}
            >
              This order would cost you{" "}
              <Odometer value={quote.fillCostUsd} prefix="$" style={{ color: "var(--signal)" }} /> extra, which
              is <Odometer value={quote.fillCostPct} suffix="%" style={{ color: "var(--signal)" }} /> of what
              you are spending. You said to block anything over{" "}
              {limitIsSet ? `${effectiveLimit.toFixed(2)}%` : "nothing"}.
            </div>
          </div>
        )}

        {/* Sign/Connect button */}
        {!shouldRefuse && (
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              margin: "0 auto 64px",
              padding: "0 24px",
            }}
          >
            <button
              onClick={connected ? handleSign : handleConnect}
              disabled={signing || settling || (connected && !quote)}
              style={{
                width: "100%",
                padding: "16px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: '"Archivo", sans-serif',
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: signing || (connected && !quote) ? "not-allowed" : "pointer",
                borderRadius: "4px",
                transition: "all 120ms ease-out",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {!connected
                ? "Connect a wallet to place this order"
                : signing
                  ? "Signing…"
                  : settling
                    ? "Waiting for the chain…"
                    : "Place this order"}
            </button>
          </div>
        )}

        {/* Below the fold: additional sections */}
        <div style={{
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 24px 64px",
        }}>
          {/* What this order touches */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontFamily: '"Archivo", sans-serif',
                fontSize: "18px",
                fontWeight: "400",
                color: "var(--text-primary)",
                marginBottom: "24px",
                letterSpacing: "-0.01em",
              }}
            >
              What else this order touches
            </h2>

            {/* Kept versus lost */}
            {quote && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <KeptVsLost amountInUsd={quote.amountInUsd} costUsd={quote.fillCostUsd} />
              </div>
            )}

            {/* Where money goes */}
            {quote && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <RouteBreakdown raw={quote.raw} />
              </div>
            )}

            {/* Issuer controls */}
            {(quote || loading) && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <IssuerControlBadges
                  extensions={quote ? quote.extensions : null}
                  loading={!quote}
                />
              </div>
            )}

            {/* Pool drain visualization */}
            {quote && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "20px",
                }}
              >
                <PoolDrain
                  amountUsd={amountNum}
                  liquidityUsd={quote.liquidityUsd}
                  refusing={Boolean(shouldRefuse)}
                />
              </div>
            )}
          </section>

          {/* Other surfaces */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontFamily: '"Archivo", sans-serif',
                fontSize: "18px",
                fontWeight: "400",
                color: "var(--text-primary)",
                marginBottom: "24px",
                letterSpacing: "-0.01em",
              }}
            >
              More surfaces
            </h2>
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr" }}>
              <a
                href="/census"
                style={{
                  display: "block",
                  padding: "20px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  textDecoration: "none",
                  background: "var(--surface)",
                  transition: "background 120ms ease-out",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface)")}
              >
                <div
                  style={{
                    fontFamily: '"Archivo", sans-serif',
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Census
                </div>
                <div
                  style={{
                    fontFamily: '"Archivo", sans-serif',
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "var(--text-muted)",
                  }}
                >
                  Compare all tokens at once, ranked by what your order really costs.
                </div>
              </a>
              <a
                href="/proof"
                style={{
                  display: "block",
                  padding: "20px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  textDecoration: "none",
                  background: "var(--surface)",
                  transition: "background 120ms ease-out",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface)")}
              >
                <div
                  style={{
                    fontFamily: '"Archivo", sans-serif',
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Proof
                </div>
                <div
                  style={{
                    fontFamily: '"Archivo", sans-serif',
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "var(--text-muted)",
                  }}
                >
                  Paste a transaction signature to verify what was promised on the screen matched what landed on the chain.
                </div>
              </a>
            </div>
          </section>
        </div>
      </div>
    </PoolHero>
  );
}
