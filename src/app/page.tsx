"use client";

import { useState, useEffect } from "react";
import { getQuote, getSwapTransaction } from "@/lib/jupiter";
import { reconcileTransaction } from "@/lib/tx";
import { TOKEN_LIST, getTokenBySymbol, USDC_MINT, getToken } from "@/lib/tokens";
import type { QuoteResult, Receipt as ReceiptType } from "@/lib/types";
import PriceAxis from "@/components/PriceAxis";
import PoolDrain from "@/components/PoolDrain";
import PoolWell from "@/components/PoolWell";
import Odometer from "@/components/Odometer";

export default function Home() {
  const [amount, setAmount] = useState("500");
  const [selectedToken, setSelectedToken] = useState("PLTRx");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [worstFillPct, setWorstFillPct] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [signing, setSigning] = useState(false);
  const [settling, setSettling] = useState(false);

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
  const amountNum = parseFloat(amount) || 500;
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
      <header style={{ width: "100%", maxWidth: "720px", padding: "48px 4px 36px" }}>
        <h1 style={{
          fontFamily: '"Archivo", sans-serif',
          fontSize: "clamp(28px, 5.2vw, 46px)",
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          fontWeight: 400,
          color: "var(--text-primary)",
          margin: "0 0 18px",
        }}>
          You are about to buy a stock that is not priced like the stock.
        </h1>
        <p style={{
          fontFamily: '"Archivo", sans-serif',
          fontSize: "clamp(14px, 2vw, 17px)",
          lineHeight: 1.55,
          color: "var(--text-muted)",
          margin: "0 0 20px",
          maxWidth: "58ch",
        }}>
          THE MARK reads the pool your order actually routes into, shows what the fill costs you in
          percent and in dollars against the price of the real share, and then signs or refuses at a
          line you set. Nothing here is stored or remembered: every figure is read the moment you
          look at it.
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
            live from Jupiter
          </span>
          <span style={{ border: "1px solid var(--border)", borderRadius: "3px", padding: "5px 9px" }}>
            Token-2022 multiplier and fee read on chain
          </span>
          <span style={{ border: "1px solid var(--border)", borderRadius: "3px", padding: "5px 9px" }}>
            no cached prices
          </span>
        </div>
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
          }}>Which stock are you buying</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {TOKEN_LIST.map((t) => {
              const active = t.symbol === selectedToken;
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
                  {t.symbol}
                </button>
              );
            })}
          </div>
        </div>

        {/* The device: the pool this order routes through, with the order carved into it.
            Its trench depth is the impact the router returned for this exact amount. */}
        <div style={{ margin: "28px 0 20px" }}>
          <PoolWell
            orderShare={quote && quote.liquidityUsd > 0 ? amountNum / quote.liquidityUsd : 0}
            fillPct={quote?.fillCostPct ?? 0}
            limitPct={effectiveLimit}
          />
          <div style={{
            marginTop: "8px",
            fontSize: "11px",
            fontFamily: '"JetBrains Mono", monospace',
            color: "var(--text-dim)",
            letterSpacing: "0.04em",
            lineHeight: 1.6,
            minHeight: "36px",
          }}>
            {quote
              ? `this token's pooled liquidity, $${Math.round(quote.liquidityUsd).toLocaleString()} read live${
                  quote.routeLegs > 1 ? `, and the router splits this order across ${quote.routeLegs} legs` : ""
                }. the trench is this order's cost measured against the line you set.`
              : "the pool this order routes into, waiting on a live quote"}
          </div>
        </div>

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
          You end up <span style={{ color: isBelow ? "var(--success)" : "var(--signal)" }}>
            <Odometer value={Math.abs(netPercent)} />
          </span>% {isBelow ? "below" : "above"} the share on {selectedToken}
        </p>

        {/* Amount Input */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontSize: "12px",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}>Amount (USD)</div>
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
              ? "the multiplier is read from the same call as the price"
              : !quote.multiplierKnown
                ? "the multiplier could not be read for this mint, so no unit adjustment is shown"
                : quote.multiplier === 1
                  ? "this mint's scaled multiplier is exactly 1, so the wallet shows the raw units"
                  : `this mint's multiplier is ${quote.multiplier.toFixed(6)}, so the wallet shows ${((quote.multiplier - 1) * 100).toFixed(2)}% more units than the raw amount`}
          </div>
        </div>

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
            }}>Worst fill you will take</div>
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
            }}>Above that line</div>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", paddingTop: "8px" }}>this button refuses</div>
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
              Refused
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "13px",
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}>
              This fill costs <Odometer value={quote.fillCostPct} suffix="%" style={{ color: "var(--signal)" }} />.
              You said you would take {limitIsSet ? `${effectiveLimit.toFixed(2)}%` : "no stated line, so nothing passes"}.
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "11px",
              color: "var(--text-dim)",
              marginTop: "10px",
            }}>
              lower the amount, or raise the line you set
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
            {!connected ? "Connect wallet to sign" : signing ? "Signing…" : settling ? "Waiting for the chain…" : "Set and sign"}
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
              Every tokenized stock measured at three order sizes at once, live, on one shared scale.
              It is where the claim above stops being an opinion.
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
              Paste a signature and it reads that transaction off the chain and reconciles it against
              what this screen promised before it was signed.
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
