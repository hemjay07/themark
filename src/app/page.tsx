"use client";

import { useState, useEffect } from "react";
import { getQuote } from "@/lib/jupiter";
import { TOKEN_LIST, getTokenBySymbol, USDC_MINT, getToken } from "@/lib/tokens";
import type { QuoteResult, Receipt as ReceiptType } from "@/lib/types";
import PriceAxis from "@/components/PriceAxis";

export default function Home() {
  const [amount, setAmount] = useState("500");
  const [selectedToken, setSelectedToken] = useState("PLTRx");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [worstFillPct, setWorstFillPct] = useState(2.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);

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

  const shouldRefuse = quote && quote.allInCostPct > worstFillPct;
  const amountNum = parseFloat(amount) || 500;
  const fillPercent = ((amountNum - 10) / (25000 - 10)) * 100;

  const handleSign = async () => {
    if (!quote || shouldRefuse) return;

    const phantom = (window as any)?.solana;
    if (!phantom?.isConnected) {
      alert("Please connect Phantom wallet first");
      return;
    }

    const token = getToken(quote.outputMint);
    const mockReceipt: ReceiptType = {
      txSignature: "mock_" + Date.now(),
      amountInUsdc: quote.amountInUsd,
      amountOutTokens: quote.amountOutTokens,
      filledPrice: quote.amountInUsd / quote.amountOutTokens,
      referencePrice: quote.referencePrice,
      costAboveReference: (quote.amountInUsd / quote.amountOutTokens - quote.referencePrice) * quote.amountOutTokens,
      costAboveReferencePct: ((quote.amountInUsd / quote.amountOutTokens - quote.referencePrice) / quote.referencePrice) * 100,
      savedVsWorstCase: (worstFillPct - quote.allInCostPct) * quote.amountInUsd / 100,
      solscanLink: "#",
      timestamp: new Date().toISOString(),
      tokenSymbol: token?.symbol || "Token",
      multiplier: quote.multiplier,
      transferFeePercentage: quote.transferFeePercentage,
    };

    setReceipt(mockReceipt);
    setQuote(null);
  };

  const handleConnect = async () => {
    const phantom = (window as any)?.solana;
    if (!phantom) {
      alert("Phantom wallet not installed");
      return;
    }

    try {
      await phantom.connect();
      setConnected(true);
    } catch (err) {
      alert("Connection failed: " + String(err));
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

        {/* Price Axis. The wrapper holds the axis's exact aspect ratio before the quote
            lands, so the arriving numbers do not push the page down. */}
        <div style={{ margin: "40px 0 36px", aspectRatio: "1000 / 300", width: "100%" }}>
          {quote && (
            <PriceAxis
              tokenPrice={quote.onChainPrice}
              sharePrice={quote.referencePrice}
              fillPercent={quote.allInCostPct}
              amount={amountNum}
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
            {Math.abs(netPercent).toFixed(2)}
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
              min="10"
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

        {/* Receipt Section */}
        <div style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "20px",
          marginBottom: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "8px 0",
            fontSize: "14px",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Your order takes</span>
            <span style={{ color: "var(--text-primary)", fontFamily: '"JetBrains Mono", monospace', textAlign: "right" }}>
              {quote ? `${((amountNum / quote.liquidityUsd) * 100).toFixed(2)}% of pool's $${(quote.liquidityUsd / 1000).toFixed(0)}K` : "waiting on a live quote"}
            </span>
          </div>
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

        {/* Sign Button */}
        <button
          onClick={handleSign}
          disabled={shouldRefuse || !quote || !connected}
          style={{
            width: "100%",
            padding: "16px",
            background: shouldRefuse ? "transparent" : "transparent",
            border: `1px solid ${shouldRefuse ? "var(--signal)" : "var(--border)"}`,
            color: shouldRefuse ? "var(--signal)" : "var(--text-primary)",
            fontFamily: '"Archivo", sans-serif',
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: shouldRefuse || !quote || !connected ? "not-allowed" : "pointer",
            borderRadius: "4px",
            transition: "all 120ms ease-out",
            marginTop: "24px",
          }}
          onMouseOver={(e) => !shouldRefuse && (e.currentTarget.style.background = "var(--surface)")}
          onMouseOut={(e) => !shouldRefuse && (e.currentTarget.style.background = "transparent")}
        >
          {!connected ? "Connect wallet" : shouldRefuse ? "This order exceeds your limit" : "Set and sign"}
        </button>

        {/* Wallet Connect */}
        {!connected && (
          <button
            onClick={handleConnect}
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
              cursor: "pointer",
              borderRadius: "4px",
              transition: "all 120ms ease-out",
              marginTop: "12px",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Connect Phantom Wallet
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
