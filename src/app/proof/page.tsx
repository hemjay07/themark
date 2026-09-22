"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { reconcileTransaction, type TxReconciliation } from "@/lib/tx";
import { getMintExtensions, getMultiplier, getTransferFeePercentage } from "@/lib/jupiter";
import { TOKEN_LIST } from "@/lib/tokens";
import Odometer from "@/components/Odometer";

const mono: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontVariantNumeric: "tabular-nums",
};

const microLabel: CSSProperties = {
  ...mono,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "var(--text-dim)",
};

const microLabelSmall: CSSProperties = {
  ...mono,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--text-dim)",
  marginBottom: "6px",
};

const dimText: CSSProperties = {
  ...mono,
  fontSize: "13px",
  color: "var(--text-dim)",
  lineHeight: 1.6,
};

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "12px",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  color: "var(--text-primary)",
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "13px",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  resize: "none",
  overflow: "hidden",
};

const buttonStyle: CSSProperties = {
  padding: "12px 20px",
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontFamily: '"Archivo", sans-serif',
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  borderRadius: "4px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

interface MintFinding {
  symbol: string;
  mint: string;
  multiplier: number | null;
  // null means the read failed, which is a different fact from "no fee"
  transferFeePct: number | null;
  loading: boolean;
}

function shortSig(sig: string): string {
  return sig.length > 16 ? `${sig.slice(0, 8)}…${sig.slice(-8)}` : sig;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={microLabelSmall}>{label}</div>
      <div style={{ ...mono, fontSize: "15px", color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function AddressRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <span style={{ ...mono, fontSize: "12px", color: href ? "var(--text-muted)" : "var(--text-dim)", wordBreak: "break-all" }}>
      {value}
    </span>
  );
  return (
    <div className="proof-addr-row" style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
      <span style={microLabelSmall}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

function ReceiptBlock({ result }: { result: TxReconciliation }) {
  const costColor = result.vsSharePct > 0 ? "var(--signal)" : "var(--success)";
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "24px",
        background: "var(--surface)",
        animation: "proof-arrive 320ms cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={microLabelSmall}>
            {result.vsSharePct >= 0 ? "paid over the reference share" : "paid under the reference share"}
          </div>
          <div style={{ ...mono, fontSize: "clamp(26px, 6vw, 36px)", color: costColor }}>
            <Odometer value={Math.abs(result.vsSharePct)} suffix="%" decimals={2} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={microLabelSmall}>in dollars</div>
          <div style={{ ...mono, fontSize: "18px", color: costColor }}>
            <Odometer
              value={Math.abs(result.vsShareUsd)}
              prefix="$"
              decimals={2}
            />
          </div>
        </div>
      </div>

      <div
        className="proof-fields"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "14px", marginBottom: "24px" }}
      >
        <Field label="paid" value={`$${result.usdcSpent.toFixed(2)} USDC`} />
        <Field label="received" value={`${result.tokenReceived.toFixed(6)} ${result.tokenSymbol}`} />
        <Field label="effective price" value={`$${result.effectivePrice.toFixed(4)}`} />
        <Field label="reference share price" value={`$${result.referencePrice.toFixed(4)}`} />
        <Field label="network fee" value={`${result.feeSol.toFixed(6)} SOL`} />
        <Field
          label="slot"
          value={result.blockTime ? `${result.slot} · ${new Date(result.blockTime * 1000).toISOString()}` : String(result.slot)}
        />
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <AddressRow label="signer" value={result.signer} />
        <AddressRow label="signature" value={result.signature} />
        <AddressRow label="solscan" value="check it on solscan →" href={`https://solscan.io/tx/${result.signature}`} />
      </div>
    </div>
  );
}

// A real Palantir purchase that settled on Solana mainnet, verified against the RPC on
// 2026-09-22. It only prefills the input so a visitor can see the feature work; every figure
// shown for it is still read live off the chain at the moment of the check.
const EXAMPLE_SIG =
  "2DDngyQMJQAyPxmcRfjW8YdhDAbvtxLpctRapRED8TQW1bRSGuNwdT1jjaZHGHFAXXabgFbKidJwKLVaghV9YfLE";

function ProofPage() {
  const [sigInput, setSigInput] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [result, setResult] = useState<TxReconciliation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [findings, setFindings] = useState<MintFinding[]>(
    TOKEN_LIST.map((t) => ({ symbol: t.symbol, mint: t.mint, multiplier: null, transferFeePct: null, loading: true }))
  );

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("sig");
    if (fromUrl) {
      setSigInput(fromUrl);
      setSignature(fromUrl);
    }
  }, []);

  useEffect(() => {
    if (!signature) {
      setResult(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setResult(null);
    reconcileTransaction(signature)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "could not reconcile this transaction");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await Promise.all(
        TOKEN_LIST.map(async (t) => {
          const ext = await getMintExtensions(t.mint);
          return {
            symbol: t.symbol,
            mint: t.mint,
            multiplier: getMultiplier(ext),
            transferFeePct: getTransferFeePercentage(ext),
            loading: false,
          };
        })
      );
      if (!cancelled) setFindings(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitSignature = () => {
    const trimmed = sigInput.trim();
    if (!trimmed) return;
    setSignature(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSignature();
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px", display: "flex", justifyContent: "center" }}>
      <main style={{ width: "100%", maxWidth: "720px", padding: "32px 0 80px" }}>
        <div style={microLabel}>THE MARK · PROOF</div>

        <h1 className="proof-h1" style={{ margin: "16px 0 0", color: "var(--text-primary)" }}>
          this receipt came off the chain, not off this page
        </h1>

        <p style={{ ...dimText, marginTop: "16px", maxWidth: "56ch" }}>
          give it a signature. it reads that transaction off Solana mainnet and reconciles what actually
          moved against a live reference price, line by line.
        </p>

        <form onSubmit={handleSubmit} className="proof-form" style={{ display: "flex", gap: "8px", margin: "28px 0" }}>
          <textarea
            value={sigInput}
            onChange={(e) => setSigInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitSignature();
              }
            }}
            placeholder="paste a receipt code from any Solana trade"
            spellCheck={false}
            rows={2}
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? "reading…" : "check it"}
          </button>
        </form>

        <div
          data-device="tx-reconciliation"
          className="proof-reconcile-zone"
          style={{
            transition: "border-color 320ms cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "proof-listening 1600ms ease-in-out infinite",
            // the zone only reserves a receipt's worth of height once there IS one to reserve;
            // before that it collapsed to a blank half-screen that read as a broken page
            minHeight: signature ? undefined : "auto",
          }}
        >
          {!signature && (
            <div>
              <p style={{ ...dimText, marginBottom: "14px" }}>
                Nothing to check yet. Every trade on Solana leaves a public receipt code. Paste one
                above and this reads that trade off the public record and works out what it really
                cost, or try a real one:
              </p>
              <button
                onClick={() => {
                  setSigInput(EXAMPLE_SIG);
                  setSignature(EXAMPLE_SIG);
                }}
                style={{
                  fontFamily: '"Archivo", sans-serif',
                  fontSize: "13px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "11px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: "var(--text-primary)",
                  color: "var(--bg)",
                  border: "1px solid var(--text-primary)",
                }}
              >
                Check a real trade
              </button>
              <p style={{ ...dimText, marginTop: "12px", fontSize: "11px" }}>
                a real Palantir purchase that settled on Solana mainnet
              </p>
            </div>
          )}

          {signature && loading && <p style={dimText}>reading {shortSig(signature)} off mainnet…</p>}

          {signature && !loading && error && (
            <div
              style={{
                border: "1px solid var(--signal)",
                borderRadius: "4px",
                padding: "16px",
                background: "rgba(196, 38, 29, 0.06)",
              }}
            >
              <div style={{ ...microLabelSmall, color: "var(--signal)" }}>refused</div>
              <p style={{ ...mono, color: "var(--text-primary)", fontSize: "13px", lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {result && !loading && !error && <ReceiptBlock result={result} />}
        </div>

        <section style={{ marginTop: "56px", paddingTop: "32px", borderTop: "1px solid var(--border)" }}>
          <div style={microLabel}>the hidden charges, read live off each token</div>
          <p style={{ ...dimText, marginTop: "10px", maxWidth: "62ch" }}>
            Two things quietly change what a token is worth, and no price feed shows either. Some
            tokens grow your balance over time instead of paying a dividend, so the number in your
            wallet is not the number you bought. Others take a cut every time the token moves.
            Both are read here from the token itself, right now.
          </p>
          <div style={{ marginTop: "20px", display: "grid", gap: "1px", background: "var(--border)" }}>
            {findings.map((f) => (
              <div key={f.mint} className="proof-finding-row" style={{ background: "var(--bg)", padding: "12px 4px" }}>
                <span style={{ ...mono, fontSize: "13px", color: "var(--text-primary)" }}>{f.symbol}</span>
                <span
                  style={{
                    ...mono,
                    fontSize: "12px",
                    color: f.multiplier && f.multiplier !== 1 ? "var(--signal)" : "var(--text-dim)",
                  }}
                >
                  {f.loading
                    ? "…"
                    : f.multiplier === null
                      ? f.transferFeePct === null
                        ? "mint could not be read"
                        : "no scaled multiplier"
                      : `×${f.multiplier.toFixed(8)}`}
                </span>
                <span
                  style={{
                    ...mono,
                    fontSize: "12px",
                    color: f.transferFeePct && f.transferFeePct > 0 ? "var(--signal)" : "var(--text-dim)",
                  }}
                >
                  {f.loading
                    ? "…"
                    : f.transferFeePct === null
                      ? "fee could not be read"
                      : f.transferFeePct > 0
                        ? `${f.transferFeePct.toFixed(2)}% transfer fee`
                        : "no transfer fee"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        @keyframes proof-arrive {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes proof-listening {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.96; }
        }
        .proof-h1 {
          font-family: Archivo, sans-serif;
          font-weight: 400;
          font-size: clamp(30px, 6vw, 52px);
          line-height: 1.08;
          letter-spacing: -0.01em;
        }
        .proof-finding-row {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr 1.2fr;
          gap: 12px;
          align-items: center;
        }
        .proof-reconcile-zone {
          min-height: 510px;
        }
        @media (max-width: 600px) {
          .proof-reconcile-zone {
            min-height: 870px;
          }
          .proof-form {
            flex-direction: column;
          }
          .proof-fields {
            grid-template-columns: 1fr !important;
          }
          .proof-finding-row {
            grid-template-columns: 1fr;
            gap: 4px;
            padding-top: 14px !important;
            padding-bottom: 14px !important;
          }
          .proof-addr-row {
            flex-direction: column;
            gap: 4px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ProofPage;
