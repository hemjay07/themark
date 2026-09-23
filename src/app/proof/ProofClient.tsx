"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { reconcileTransaction, type TxReconciliation } from "@/lib/tx";
import { getIssuerControls, getMintExtensions, getMultiplier, getTransferFeePercentage } from "@/lib/jupiter";
import { TOKEN_LIST } from "@/lib/tokens";
import type { IssuerControl } from "@/lib/types";
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
  // null means the extension read failed; a failed read is never shown as "no controls found"
  controls: IssuerControl[] | null;
  loading: boolean;
}

function shortSig(sig: string): string {
  return sig.length > 16 ? `${sig.slice(0, 8)}…${sig.slice(-8)}` : sig;
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

// "Intel xStock" -> "Intel", "T-OpenAI" -> "OpenAI"
function plainName(symbol: string): string {
  const t = TOKEN_LIST.find((x) => x.symbol === symbol);
  return (t?.name ?? symbol).replace(/ xStock$/, "").replace(/^T-/, "").replace(/^SP500$/, "S&P 500");
}

function ReceiptBlock({ result }: { result: TxReconciliation }) {
  const over = result.vsShareUsd > 0;
  const colour = over ? "var(--signal)" : "var(--success)";
  const name = plainName(result.tokenSymbol);
  const when = result.blockTime
    ? new Date(result.blockTime * 1000).toUTCString().replace(/ GMT$/, " UTC").replace(/^\w+, /, "")
    : null;
  return (
    <div style={{ animation: "proof-arrive 320ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
      <div style={microLabel}>{over ? "what this trade really cost you" : "this trade came in under the real share by"}</div>
      <div
        style={{
          ...mono,
          fontSize: "clamp(56px, 11vw, 128px)",
          lineHeight: 1,
          minHeight: "1em",
          letterSpacing: "-0.02em",
          fontWeight: 600,
          color: colour,
          margin: "10px 0 12px",
        }}
      >
        <Odometer value={Math.abs(result.vsShareUsd)} prefix="$" decimals={2} />
      </div>
      <p style={{ fontFamily: "Archivo, sans-serif", fontSize: "18px", lineHeight: 1.45, color: "var(--text-primary)", margin: 0, maxWidth: "46ch" }}>
        {over ? "more" : "less"} than {result.tokenReceived.toFixed(2)} shares of {name} are worth at the
        real share price.
      </p>

      <div className="proof-facts" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", margin: "28px 0 14px" }}>
        {[
          ["you paid", `$${result.usdcSpent.toFixed(2)}`],
          ["you got", `${result.tokenReceived.toFixed(4)} ${name}`],
          ["per share", `$${result.effectivePrice.toFixed(2)}, real $${result.referencePrice.toFixed(2)}`],
        ].map(([k, v]) => (
          <div key={k} style={{ background: "var(--surface)", padding: "16px" }}>
            <div style={microLabelSmall}>{k}</div>
            <div style={{ ...mono, fontSize: "16px", color: "var(--text-primary)", marginTop: "6px" }}>{v}</div>
          </div>
        ))}
      </div>

      <p style={{ ...dimText, fontSize: "12px", margin: "0 0 20px", maxWidth: "70ch" }}>
        The real share price is read now{when ? `, not at the moment of the trade (${when})` : ""}, so
        anything the market has done since is in this figure too.
      </p>

      <a
        href={`https://solscan.io/tx/${result.signature}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          fontFamily: "Archivo, sans-serif",
          fontSize: "13px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "11px 16px",
          borderRadius: "4px",
          background: "var(--text-primary)",
          color: "var(--bg)",
          textDecoration: "none",
        }}
      >
        See this trade on Solscan
      </a>

      <details style={{ marginTop: "22px" }}>
        <summary style={{ ...microLabelSmall, cursor: "pointer" }}>the raw record</summary>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
          <AddressRow label="receipt code" value={result.signature} />
          <AddressRow label="wallet" value={result.signer} />
          <AddressRow label="network fee" value={`${result.feeSol.toFixed(6)} SOL`} />
          <AddressRow label="block" value={String(result.slot)} />
        </div>
      </details>
    </div>
  );
}

// A real $550.16 Intel purchase that settled on Solana mainnet at 04:21 UTC on 2026-09-23, found
// with getSignaturesForAddress on the INTCx mint. It only prefills the input so a visitor can see the
// feature work; every figure shown for it is read live off the chain at the moment of the check.
// Intel's balance multiplier is exactly 1, so wallet units and raw units agree for this example.
const EXAMPLE_SIG =
  "5C36Vdt21D5Y36xeTp6QaceVDsnLSaEum2Hu3fpjPUTkcG4CtTJpkB2jPKKhfj1XUUDrbd9aZhtX1byF5Lutwr6U";

// The receipt code arrives from the server (page.tsx reads ?sig=), so the first paint is already the
// loading state. Reading it from window.location after mount swapped the empty state for the loading
// state 92ms in and pushed everything below it down by ~700px (CLS 0.09 at 390).
export default function ProofClient({ initialSig }: { initialSig: string | null }) {
  const [sigInput, setSigInput] = useState(initialSig ?? "");
  const [signature, setSignature] = useState<string | null>(initialSig);
  const [result, setResult] = useState<TxReconciliation | null>(null);
  const [loading, setLoading] = useState(Boolean(initialSig));
  const [error, setError] = useState("");
  const [findings, setFindings] = useState<MintFinding[]>(
    TOKEN_LIST.map((t) => ({ symbol: t.symbol, mint: t.mint, multiplier: null, transferFeePct: null, controls: null, loading: true }))
  );

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
            controls: getIssuerControls(ext),
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

  const read = findings.filter((f) => !f.loading && f.controls !== null);
  const anyLoading = findings.some((f) => f.loading);
  const unreadable = findings.filter((f) => !f.loading && f.controls === null).map((f) => f.symbol);
  const has = (key: string) => read.filter((f) => f.controls!.some((c) => c.key === key)).map((f) => f.symbol);
  const powerRows = [
    { label: "The issuer can move your tokens", meaning: "They can take tokens out of your wallet without asking you.", tokens: has("permanentDelegate"), tone: "var(--signal)" },
    { label: "The issuer can halt trading", meaning: "Trading can be paused for everyone, with no warning.", tokens: has("pausableConfig"), tone: "var(--signal)" },
    { label: "Custom code runs on every transfer", meaning: "Code the issuer controls can block or change a transfer.", tokens: has("transferHook"), tone: "var(--signal)" },
    { label: "Transfer amounts can be hidden", meaning: "What moved is not always visible on the public record.", tokens: has("confidentialTransferMint"), tone: "var(--signal)" },
    { label: "New accounts start frozen", meaning: "A fresh wallet cannot move the token until the issuer allows it.", tokens: has("defaultAccountState"), tone: "var(--signal)" },
    { label: "Takes a cut every time it moves", meaning: "A fee comes off each transfer, on top of the price.", tokens: findings.filter((f) => !f.loading && (f.transferFeePct ?? 0) > 0).map((f) => `${f.symbol} ${f.transferFeePct!.toFixed(2)}%`), tone: "var(--signal)" },
    { label: "Grows your balance instead of paying dividends", meaning: "The number in your wallet drifts up, so it is not the number you bought.", tokens: findings.filter((f) => !f.loading && f.multiplier !== null && f.multiplier !== 1).map((f) => `${f.symbol} +${((f.multiplier! - 1) * 100).toFixed(2)}%`), tone: "var(--text-muted)" },
  ];

  return (
    <div style={{ minHeight: "100vh", padding: "20px", display: "flex", justifyContent: "center" }}>
      <main style={{ width: "100%", maxWidth: "720px", padding: "32px 0 80px" }}>
        <div style={microLabel}>proof</div>

        <h1 className="proof-h1" style={{ margin: "16px 0 0", color: "var(--text-primary)" }}>
          Did the trade give you what you paid for?
        </h1>

        <p style={{ fontFamily: "Archivo, sans-serif", fontSize: "16px", lineHeight: 1.5, color: "var(--text-muted)", marginTop: "16px", maxWidth: "56ch" }}>
          Every trade on Solana leaves a public receipt. Paste one here and it reads what really moved
          off the chain, then prices it against the real share.
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
            rows={3}
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
                Nothing to check yet. Paste a receipt code above, or try a real one:
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
                a real $550 Intel purchase made on 23 September, read live off the chain
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

        {/* One list of findings instead of the same four badges printed under five tokens: each
            power, then the tokens that carry it. Every row is read from the token itself, now. */}
        <section style={{ marginTop: "72px", paddingTop: "32px", borderTop: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 400, fontSize: "clamp(24px, 4vw, 34px)", lineHeight: 1.15, color: "var(--text-primary)", margin: 0 }}>
            What each token can do to your money
          </h2>
          <p style={{ ...dimText, marginTop: "10px", maxWidth: "60ch" }}>
            None of this shows up in a price. Read from each token itself, right now.
          </p>
          <div style={{ marginTop: "24px", display: "grid", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
            {powerRows.map((row) => (
              <div key={row.label} className="proof-power-row" style={{ background: "var(--bg)", padding: "16px 18px" }}>
                <div>
                  <div style={{ fontFamily: "Archivo, sans-serif", fontSize: "15px", color: row.tokens.length ? "var(--text-primary)" : "var(--text-dim)" }}>
                    {row.label}
                  </div>
                  <div style={{ ...dimText, fontSize: "12px", marginTop: "4px" }}>{row.meaning}</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end", alignContent: "flex-start" }}>
                  {anyLoading && !row.tokens.length ? (
                    <span style={{ ...mono, fontSize: "12px", color: "var(--text-dim)" }}>reading…</span>
                  ) : row.tokens.length ? (
                    row.tokens.map((t) => (
                      <span key={t} style={{ ...mono, fontSize: "12px", color: row.tone, border: `1px solid ${row.tone}`, borderRadius: "3px", padding: "3px 8px" }}>
                        {t}
                      </span>
                    ))
                  ) : (
                    <span style={{ ...mono, fontSize: "12px", color: "var(--text-dim)" }}>none of these tokens</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {unreadable.length > 0 && (
            <p style={{ ...dimText, fontSize: "12px", marginTop: "12px" }}>
              Could not read {unreadable.join(", ")} right now, so {unreadable.length === 1 ? "it is" : "they are"} left out above rather than shown as clean.
            </p>
          )}
        </section>
      </main>

      {/* dangerouslySetInnerHTML: a text child would get ">" escaped on the server and not in the
          browser, a hydration mismatch (React #425) */}
      <style dangerouslySetInnerHTML={{ __html: `
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
        .proof-power-row {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .proof-reconcile-zone {
          min-height: 510px;
        }
        @media (max-width: 600px) {
          .proof-reconcile-zone {
            min-height: 640px;
          }
          .proof-form {
            flex-direction: column;
          }
          .proof-fields {
            grid-template-columns: 1fr !important;
          }
          .proof-power-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .proof-power-row > div:last-child {
            justify-content: flex-start !important;
          }
          .proof-facts {
            grid-template-columns: 1fr !important;
          }
          .proof-addr-row {
            flex-direction: column;
            gap: 4px !important;
          }
        }
      ` }} />
    </div>
  );
}

