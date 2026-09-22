"use client";

import type { CSSProperties } from "react";
import { getIssuerControls } from "@/lib/jupiter";
import type { ParsedExtension } from "@/lib/types";

const microLabel: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-dim)",
};

const dimLine: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "12px",
  color: "var(--text-dim)",
  lineHeight: 1.6,
};

interface IssuerControlBadgesProps {
  extensions: ParsedExtension[] | null;
  loading: boolean;
}

// What the issuer of this mint can do to a holder's money, read live off the mint account.
// A failed read is never rendered as an absence of risk (charter ban 1): it says the read
// failed. An empty result, read successfully, is a different fact and says so plainly.
export default function IssuerControlBadges({ extensions, loading }: IssuerControlBadgesProps) {
  const controls = loading ? null : getIssuerControls(extensions);

  return (
    <div>
      <div style={{ ...microLabel, marginBottom: "10px" }}>what the issuer can do to your money</div>
      {loading && <div style={dimLine}>reading this mint&apos;s issuer controls…</div>}
      {!loading && extensions === null && (
        <div style={{ ...dimLine, color: "var(--signal)" }}>
          could not read this mint&apos;s issuer controls just now. that is a failed read, not a clean bill —
          nothing below is shown as safe because of it.
        </div>
      )}
      {!loading && extensions !== null && controls !== null && controls.length === 0 && (
        <div style={dimLine}>
          none of the powers this checks for were found on this mint, read live just now.
        </div>
      )}
      {!loading && controls !== null && controls.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
          {controls.map((c) => (
            <div
              key={c.key}
              style={{
                background: "var(--bg)",
                padding: "10px 12px",
                borderLeft: "2px solid var(--signal)",
              }}
            >
              <div
                style={{
                  fontFamily: '"Archivo", sans-serif',
                  fontSize: "13px",
                  color: "var(--signal)",
                  marginBottom: "3px",
                }}
              >
                {c.label}
              </div>
              <div style={{ ...dimLine, color: "var(--text-muted)" }}>{c.meaning}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
