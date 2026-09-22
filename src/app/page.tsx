"use client";

import { useState, useEffect } from "react";
import { getQuote, getSwapTransaction } from "@/lib/jupiter";
import { reconcileTransaction } from "@/lib/tx";
import { TOKEN_LIST, getTokenBySymbol, USDC_MINT, getToken } from "@/lib/tokens";
import type { QuoteResult, Receipt as ReceiptType } from "@/lib/types";
import PriceAxis from "@/components/PriceAxis";
import PoolDrain from "@/components/PoolDrain";
import PoolHero from "@/components/PoolHero";
import Odometer from "@/components/Odometer";
import KeptVsLost from "@/components/KeptVsLost";
import RouteBreakdown from "@/components/RouteBreakdown";
import IssuerControlBadges from "@/components/IssuerControlBadges";

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
          "No live quote right now, so there is nothing to show. This screen never fills the gap with a remembered price."
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
  // This is the whole claim in one row: the same order costs wildly different amounts
  // depending only on which pool it lands in.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const amt = parseFloat(amount);
      if (!amt || amt < 10 || amt > 25000) return;
      const lamports = String(Math.floor(amt * 1e6));
      const limit = Number.isFinite(worstFillPct) ? worstFillPct : 0;
      const bps = Math.max(1, Math.min(5000, Math.round(limit * 100)));

      const tasks = [...TOKEN_LIST];
      let next = 0;
      const worker = async () => {
        while (!cancelled) {
          const i = next++;
          if (i >= tasks.length) return;
          const t = tasks[i];
          try {
            const q = await getQuote(USDC_MINT, t.mint, lamports, bps);
            if (!cancelled) {
              setCostByToken((prev) => ({ ...prev, [t.symbol]: q ? q.fillCostPct : null }));
            }
          } catch {
            if (!cancelled) setCostByToken((prev) => ({ ...prev, [t.symbol]: null }));
          }
        }
      };
      await Promise.all(Array.from({ length: 4 }, worker));
    };
    const timer = setTimeout(run, 700);
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      {/* The fold says what this is before it shows the instrument. A stranger arriving here
          should know the product and the claim in three seconds, without reading a number. */}
      <PoolHero
        orderShare={quote && quote.liquidityUsd > 0 ? amountNum / quote.liquidityUsd : 0}
        fillPct={quote?.fillCostPct ?? 0}
        limitPct={effectiveLimit}
      >
      <header style={{ width: "100%", maxWidth: "720px", margin: "0 auto", padding: "64px 20px 56px" }}>
        <h1 style={{
          fontFamily: '"Archivo", sans-serif',
          fontSize: "clamp(28px, 5.2vw, 46px)",
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          fontWeight: 400,
          color: "var(--text-primary)",
          margin: "0 0 18px",
        }}>
          Buying a stock on Solana? You are probably overpaying, and nothing tells you by how much.
        </h1>
        <p style={{
          fontFamily: '"Archivo", sans-serif',
          fontSize: "clamp(14px, 2vw, 17px)",
          lineHeight: 1.55,
          color: "var(--text-muted)",
          margin: "0 0 20px",
          maxWidth: "58ch",
        }}>
          Say you want $500 of Palantir. On Solana you buy a token that tracks the real share, but
          the price you actually get is worse than the real share price. Sometimes by pennies.
          Sometimes by hundreds of dollars. THE MARK works out that difference before you buy, in
          plain dollars, and stops the trade if it is bigger than you said you would accept.
        </p>
        <div style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
        }}>
          <span style={{ border: "1px solid var(--border)", borderRadius: "3px", padding: "5px 9px" }}>
            1 · pick a stock and an amount
          </span>
          <span style={{ border: "1px solid var(--border)", borderRadius: "3px", padding: "5px 9px" }}>
            2 · see exactly what you overpay
          </span>
          <span style={{ border: "1px solid var(--border)", borderRadius: "3px", padding: "5px 9px" }}>
            3 · it blocks the bad trade
          </span>
        </div>
        <p style={{
          fontFamily: '"Archivo", sans-serif',
          fontSize: "13px",
          lineHeight: 1.55,
          color: "var(--text-dim)",
          margin: "18px 0 0",
          maxWidth: "58ch",
        }}>
          You do not need a wallet to use any of this. Everything below is live right now. A wallet
          is only needed for the last step, actually placing the order.
        </p>
      </header>

      <main style={{
        width: "100%",
        maxWidth: "580px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "32px",
      }}>

        {/* Which stock. Without this the product quotes one token forever. */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            fontSize: "11px",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "10px",
            fontFamily: '"JetBrains Mono", monospace',
          }}>1 · Which stock do you want</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {TOKEN_LIST.map((t) => {
              const active = t.symbol === selectedToken;
              const cost = costByToken[t.symbol];
              return (
                <button
                  key={t.mint}
                  onClick={() => setSelectedToken(t.symbol)}
                  aria-pressed={active}
                  title={t.name}
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "12px",
                    padding: "7px 11px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: active ? "var(--text-primary)" : "transparent",
                    color: active ? "var(--bg)" : "var(--text-muted)",
                    border: `1px solid ${active ? "var(--text-primary)" : "var(--border)"}`,
                    transition: "background 120ms ease-out, color 120ms ease-out",
                  }}
                >
                  <span>{t.symbol}</span>
                  <span style={{
                    display: "block",
                    fontSize: "10px",
                    marginTop: "3px",
                    opacity: 0.85,
                    color: active
                      ? "var(--bg)"
                      : cost === null || cost === undefined
                        ? "var(--text-dim)"
                        : cost > 1
                          ? "var(--signal)"
                          : "var(--text-dim)",
                  }}>
                    {cost === undefined ? "…" : cost === null ? "no read" : `${cost.toFixed(2)}%`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The pool itself is now the ground of the fold above, not a tile in this card. */}
        <div style={{
          marginBottom: "22px",
          fontSize: "11px",
          fontFamily: '"JetBrains Mono", monospace',
          color: "var(--text-dim)",
          letterSpacing: "0.04em",
          lineHeight: 1.6,
          minHeight: "36px",
        }}>
          {quote
            ? `the surface behind this page is the supply your order buys from, $${Math.round(quote.liquidityUsd).toLocaleString()} of it${
                quote.routeLegs > 1 ? `, spread across ${quote.routeLegs} places` : ""
              }. the gouge in it is the bite your order takes.`
            : "reading what is available to buy right now"}
        </div>

        {/* The number this surface exists to say, at the size that says it. It used to be
            11px red mono under a pair of 30px prices whose difference was the actual point. */}
        <div style={{ margin: "26px 0 6px", minHeight: "118px" }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
            fontFamily: '"JetBrains Mono", monospace',
            marginBottom: "6px",
          }}>
            What this order costs you
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: "clamp(40px, 9vw, 68px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: shouldRefuse ? "var(--signal)" : "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {quote ? <Odometer value={quote.fillCostUsd} prefix="$" /> : "$—"}
          </div>
          <div style={{
            fontFamily: '"Archivo", sans-serif',
            fontSize: "14px",
            color: "var(--text-muted)",
            marginTop: "10px",
            lineHeight: 1.5,
          }}>
            {quote
              ? `extra on your $${amountNum.toFixed(0)}, which is ${quote.fillCostPct.toFixed(2)}% of what you spend`
              : "reading the pool right now"}
          </div>
        </div>

        {/* Kept versus lost, in absolute dollars. Same figures already on screen above, said
            the way a stranger feels them: what becomes shares, what is gone in costs. */}
        {quote && (
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "18px 20px",
            marginBottom: "8px",
          }}>
            <KeptVsLost amountInUsd={quote.amountInUsd} costUsd={quote.fillCostUsd} />
          </div>
        )}

        {/* Price Axis. The wrapper holds the axis's exact aspect ratio before the quote
            lands, so the arriving numbers do not push the page down. */}
        <div style={{ margin: "40px 0 36px", aspectRatio: "1000 / 300", width: "100%" }}>
          {quote && (
            <PriceAxis
              tokenPrice={quote.effectivePrice}
              sharePrice={quote.referencePrice}
              fillPercent={quote.fillCostPct}
              amount={amountNum}
              worstFillPct={effectiveLimit}
            />
          )}
        </div>

        {/* The reading, in one sentence */}
        <p style={{
          fontSize: "15px",
          fontWeight: "400",
          marginBottom: "32px",
          marginTop: "0",
          color: "var(--text-primary)",
          textAlign: "center",
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
        } as any}>
          All in, you end up{" "}
          <span style={{ color: isBelow ? "var(--success)" : "var(--signal)" }}>
            <Odometer value={Math.abs(netPercent)} />
          </span>
          % {isBelow ? "cheaper than" : "dearer than"} the real{" "}
          {selectedToken.replace(/^t/, "").replace(/x$/, "")} share
          {quote ? `, about $${Math.abs((netPercent / 100) * amountNum).toFixed(2)} on $${amountNum.toFixed(0)}` : ""}
        </p>

        {/* Amount Input */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontSize: "12px",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}>2 · How much do you want to spend</div>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            min="10"
            max="25000"
            step="100"
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              color: "var(--text-primary)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "16px",
              marginBottom: "16px",
            }}
          />
          <div style={{ position: "relative" }}>
            <input
              type="range"
              min="100"
              max="25000"
              step="100"
              value={amount}
              onChange={handleSliderChange}
              style={{
                width: "100%",
                height: "4px",
                borderRadius: "2px",
                outline: "none",
                appearance: "none",
                accentColor: "#C4261D",
                background: `linear-gradient(to right, var(--signal) 0%, var(--signal) ${fillPercent}%, var(--border) ${fillPercent}%, var(--border) 100%)`,
              } as any}
            />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 8px",
              marginTop: "8px",
              fontSize: "10px",
              color: "var(--text-dim)",
            }}>
              <span>$10</span>
              <span>$5K</span>
              <span>$25K</span>
            </div>
          </div>
        </div>

        {/* The pool, drawn as depth blocks the order eats. Live liquidity from the quote. */}
        <div style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "20px",
          marginBottom: "32px",
        }}>
          <PoolDrain
            amountUsd={amountNum}
            liquidityUsd={quote?.liquidityUsd ?? 0}
            refusing={Boolean(shouldRefuse)}
          />
          <div style={{
            fontSize: "11px",
            color: "var(--text-dim)",
            marginTop: "16px",
            minHeight: "32px",
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            {!quote
              ? "checking whether this token pays out by quietly growing your balance"
              : !quote.multiplierKnown
                ? "could not check whether this token grows your balance over time, so that is not counted above"
                : quote.multiplier === 1
                  ? "this token does not grow your balance over time, so what you buy is what you hold"
                  : `this token has grown ${((quote.multiplier - 1) * 100).toFixed(2)}% since launch instead of paying a dividend, and that is counted above`}
          </div>
        </div>

        {/* Where the money actually goes: the router's own routePlan, already fetched with
            every quote and never shown until now. */}
        <div style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "20px",
          marginBottom: "32px",
        }}>
          {quote ? <RouteBreakdown raw={quote.raw} /> : (
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "12px",
              color: "var(--text-dim)",
            }}>
              reading where this order would route
            </div>
          )}
        </div>

        {/* What the issuer of this mint can do to a holder's money, read live off the mint
            account. A failed read is never shown as a clean bill (charter ban 1). */}
        {(quote || loading) && (
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "20px",
            marginBottom: "32px",
          }}>
            <IssuerControlBadges
              extensions={quote ? quote.extensions : null}
              loading={!quote}
            />
          </div>
        )}

        {/* Worst Fill Input */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "32px",
          paddingBottom: "24px",
          paddingTop: "24px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontSize: "11px",
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
            }}>3 · Block the trade if I overpay more than</div>
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={worstFillPct}
              onChange={(e) => setWorstFillPct(parseFloat(e.target.value))}
              style={{
                padding: "8px",
                fontSize: "14px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: "var(--text-primary)",
                fontFamily: '"JetBrains Mono", monospace',
                width: "100%",
              }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontSize: "11px",
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
            }}>What happens then</div>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", paddingTop: "8px" }}>the button below stops you</div>
          </div>
        </div>

        {/* The sign control. Above the line the founder set, it stops being a button and becomes
            a refusal that states the number: the product's whole claim, made visible. */}
        {shouldRefuse && quote ? (
          <div
            data-refusal
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "20px",
              border: "1px solid var(--signal)",
              borderRadius: "4px",
              background: "rgba(196, 38, 29, 0.06)",
              animation: "refuse-in 180ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            <div style={{
              fontFamily: '"Archivo", sans-serif',
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--signal)",
              marginBottom: "10px",
            }}>
              Blocked
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "13px",
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}>
              This order would cost you{" "}
              <Odometer value={quote.fillCostUsd} prefix="$" style={{ color: "var(--signal)" }} /> extra, which
              is <Odometer value={quote.fillCostPct} suffix="%" style={{ color: "var(--signal)" }} /> of what
              you are spending. You said to block anything over{" "}
              {limitIsSet ? `${effectiveLimit.toFixed(2)}%` : "nothing, so everything is blocked"}.
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "11px",
              color: "var(--text-dim)",
              marginTop: "10px",
            }}>
              try a smaller amount, a different stock, or raise your limit
            </div>
          </div>
        ) : (
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
              marginTop: "24px",
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
        )}

        {/* Receipt Display */}
        {receipt && (
          <div style={{
            marginTop: "32px",
            padding: "20px",
            background: "var(--bg)",
            border: "2px solid var(--success)",
            borderRadius: "6px",
          }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "24px", marginBottom: "8px" }}>✓</p>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--success)" }}>RECEIPT</h2>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              fontSize: "14px",
            }}>
              <div>
                <p style={{ color: "var(--text-muted)" }}>Filled at</p>
                <p style={{ fontSize: "16px", fontWeight: "600" }}>${receipt.filledPrice.toFixed(2)}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)" }}>Reference</p>
                <p style={{ fontSize: "16px", fontWeight: "600" }}>${receipt.referencePrice.toFixed(2)}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)" }}>You Paid</p>
                <p style={{ fontSize: "16px", fontWeight: "600" }}>${receipt.amountInUsdc.toFixed(2)}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)" }}>You Received</p>
                <p style={{ fontSize: "16px", fontWeight: "600" }}>{receipt.amountOutTokens.toFixed(2)} {receipt.tokenSymbol}</p>
              </div>
            </div>
            <button
              onClick={() => setReceipt(null)}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "16px",
                background: "var(--border)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              New Order
            </button>
          </div>
        )}
      </main>

      </PoolHero>

      {/* The rest of the product, said plainly, so a reader knows there are two more surfaces. */}
      <section style={{ width: "100%", maxWidth: "720px", padding: "44px 4px 64px" }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "11px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          marginBottom: "16px",
        }}>
          Two more surfaces
        </div>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <a
            href="/census"
            style={{
              display: "block",
              padding: "18px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              textDecoration: "none",
              background: "var(--surface)",
            }}
          >
            <div style={{
              fontFamily: '"Archivo", sans-serif',
              fontSize: "17px",
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}>
              The census
            </div>
            <div style={{
              fontFamily: '"Archivo", sans-serif',
              fontSize: "14px",
              lineHeight: 1.5,
              color: "var(--text-muted)",
            }}>
              The same check run on every stock at once, for three different amounts. Some cost you
              almost nothing. One costs you forty times more. Worth a look before you pick.
            </div>
          </a>
          <a
            href="/proof"
            style={{
              display: "block",
              padding: "18px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              textDecoration: "none",
              background: "var(--surface)",
            }}
          >
            <div style={{
              fontFamily: '"Archivo", sans-serif',
              fontSize: "17px",
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}>
              The proof
            </div>
            <div style={{
              fontFamily: '"Archivo", sans-serif',
              fontSize: "14px",
              lineHeight: 1.5,
              color: "var(--text-muted)",
            }}>
              Paste the receipt code from any past trade and it checks, against the public record,
              whether what was promised beforehand is what actually happened.
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
