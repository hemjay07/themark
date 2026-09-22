"use client";

import { useState, useEffect } from "react";
import { getQuote, getSwapTransaction } from "@/lib/jupiter";
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
      if (!amountNum || amountNum < 10 || amountNum > 25000) return;

      const token = getTokenBySymbol(selectedToken);
      if (!token) return;

      setLoading(true);
      try {
        const amountInLamports = String(Math.floor(amountNum * 1e6));
        const q = await getQuote(USDC_MINT, token.mint, amountInLamports);
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

    if (!initialized) {
      setInitialized(true);
      fetchQuote();
    } else {
      const timer = setTimeout(() => {
        if (amount && selectedToken) fetchQuote();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [amount, selectedToken, initialized]);

  const shouldRefuse = quote && quote.fillCostPct > worstFillPct;
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

      const token = getToken(quote.outputMint);
      setReceipt({
        txSignature: signature,
        amountInUsdc: quote.amountInUsd,
        amountOutTokens: quote.amountOutTokens,
        filledPrice: quote.amountInUsd / quote.amountOutTokens,
        referencePrice: quote.referencePrice,
        costAboveReference:
          (quote.amountInUsd / quote.amountOutTokens - quote.referencePrice) * quote.amountOutTokens,
        costAboveReferencePct:
          ((quote.amountInUsd / quote.amountOutTokens - quote.referencePrice) / quote.referencePrice) * 100,
        savedVsWorstCase: ((worstFillPct - quote.fillCostPct) * quote.amountInUsd) / 100,
        solscanLink: `https://solscan.io/tx/${signature}`,
        timestamp: new Date().toISOString(),
        tokenSymbol: token?.symbol || "Token",
        multiplier: quote.multiplier,
        transferFeePercentage: quote.transferFeePercentage,
      });
    } catch (err) {
      // No receipt is ever shown for a transaction that did not land. (charter ban 1)
      console.error("Sign failed:", err);
      setError("The transaction did not go through, so there is no receipt to show.");
    } finally {
      setSigning(false);
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

  const netPercent = quote ? quote.allInCostPct - ((quote.referencePrice - quote.onChainPrice) / quote.referencePrice * 100) : 0;
  const isBelow = netPercent < 0;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
      <main style={{
        width: "100%",
        maxWidth: "580px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "32px",
      }}>
        <div style={{
          fontSize: "14px",
          fontWeight: "400",
          marginBottom: "32px",
          color: "var(--text-muted)",
          fontFamily: '"JetBrains Mono", monospace',
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}>The Mark · A</div>

        {/* The device: the pool this order routes through, with the order carved into it.
            Its trench depth is the impact the router returned for this exact amount. */}
        <div style={{ margin: "28px 0 20px" }}>
          <PoolWell
            orderShare={quote && quote.liquidityUsd > 0 ? amountNum / quote.liquidityUsd : 0}
            fillPct={quote?.fillCostPct ?? 0}
            limitPct={worstFillPct}
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
              ? `the pool this order routes through, $${Math.round(quote.liquidityUsd).toLocaleString()} deep, read live. the trench is the router's own impact for this amount.`
              : "the pool this order routes through, waiting on a live quote"}
          </div>
        </div>

        {/* Price Axis. The wrapper holds the axis's exact aspect ratio before the quote
            lands, so the arriving numbers do not push the page down. */}
        <div style={{ margin: "40px 0 36px", aspectRatio: "1000 / 300", width: "100%" }}>
          {quote && (
            <PriceAxis
              tokenPrice={quote.onChainPrice}
              sharePrice={quote.referencePrice}
              fillPercent={quote.fillCostPct}
              amount={amountNum}
              worstFillPct={worstFillPct}
            />
          )}
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "14px",
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
          </span>% {isBelow ? "below" : "above"} the share
        </h1>
        <style>
          {`
            @media (max-width: 600px) {
              h1 {
                font-size: 13px !important;
              }
            }
          `}
        </style>

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
              You said you would take {worstFillPct.toFixed(1)}%.
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
            disabled={signing || (connected && !quote)}
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
            {!connected ? "Connect wallet to sign" : signing ? "Signing…" : "Set and sign"}
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
    </div>
  );
}
