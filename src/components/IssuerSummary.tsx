"use client";

import { getIssuerControls } from "@/lib/jupiter";
import { displayName } from "@/lib/tokens";
import type { ParsedExtension } from "@/lib/types";

// What the issuer of the selected token can do to your money, in one plain sentence each, read live
// off the token. The strongest thing this product knows, so it sits right under the advice, not at the
// bottom. A failed read says so; it is never shown as "no risks". (design/PRD-V3.md R4)
const PLAIN: Record<string, string> = {
  permanentDelegate: "The issuer can take tokens out of your wallet without asking you.",
  pausableConfig: "The issuer can stop all trading in it, for everyone, with no warning.",
  transferHook: "The issuer runs its own code on every transfer, and that code can block or change it.",
  confidentialTransferMint: "Transfer amounts can be hidden, so the public record may not show what moved.",
  defaultAccountState: "A new wallet starts frozen and cannot move it until the issuer allows it.",
};

export default function IssuerSummary({
  symbol,
  extensions,
  loading,
}: {
  symbol: string;
  extensions: ParsedExtension[] | null | undefined;
  loading: boolean;
}) {
  const controls = extensions === undefined ? undefined : getIssuerControls(extensions ?? null);
  const name = displayName(symbol);

  return (
    <section data-issuer style={{ marginTop: "28px" }}>
      <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 500, fontSize: "18px", color: "var(--text-primary)", margin: "0 0 12px" }}>
        Before you buy {name}
      </h2>
      {loading || controls === undefined ? (
        <p style={{ fontFamily: "Archivo, sans-serif", fontSize: "14px", color: "var(--text-dim)", margin: 0 }}>
          Reading what the issuer of {name} can do…
        </p>
      ) : controls === null ? (
        <p style={{ fontFamily: "Archivo, sans-serif", fontSize: "14px", color: "var(--text-dim)", margin: 0 }}>
          Could not read {name}&apos;s token right now, so its issuer powers are unknown, not absent.
        </p>
      ) : controls.length === 0 ? (
        <p style={{ fontFamily: "Archivo, sans-serif", fontSize: "15px", color: "var(--text-primary)", margin: 0 }}>
          The issuer of {name} holds none of the powers this checks for.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
          {controls.map((c) => (
            <li
              key={c.key}
              style={{
                fontFamily: "Archivo, sans-serif",
                fontSize: "15px",
                lineHeight: 1.5,
                color: "var(--text-primary)",
                borderLeft: "2px solid var(--signal)",
                paddingLeft: "12px",
              }}
            >
              {PLAIN[c.key] ?? c.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
