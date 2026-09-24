"use client";

import { TOKEN_LIST } from "@/lib/tokens";
import { displayName } from "@/lib/tokens";

interface ControlsSectionProps {
  selectedToken: string;
  onSelectToken: (symbol: string) => void;
  amount: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  worstFillPct: number;
  onLimitChange: (value: number) => void;
  costByToken: Record<string, number | null>;
}

// Controls visible on the first screen: stock chips, amount slider, limit input.
const CHIP_CSS = "@keyframes chip-pulse{0%,100%{opacity:.15}50%{opacity:.5}}";

export default function ControlsSection({
  selectedToken,
  onSelectToken,
  amount,
  onAmountChange,
  onSliderChange,
  worstFillPct,
  onLimitChange,
  costByToken,
}: ControlsSectionProps) {
  const amountNum = parseFloat(amount) || 5000;
  const fillPercent = ((amountNum - 10) / (25000 - 10)) * 100;

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CHIP_CSS }} />
      {/* Stock selector chips */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          pick a stock
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {TOKEN_LIST.map((t) => {
            const active = t.symbol === selectedToken;
            const cost = costByToken[t.symbol];
            return (
              <button
                key={t.mint}
                onClick={() => onSelectToken(t.symbol)}
                aria-pressed={active}
                title={t.name}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: "12px",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: active ? "var(--text-primary)" : "transparent",
                  color: active ? "var(--bg)" : "var(--text-muted)",
                  border: `1px solid ${active ? "var(--text-primary)" : "var(--border)"}`,
                  transition: "background 120ms ease-out, color 120ms ease-out",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ display: "block", fontFamily: "Archivo, sans-serif", fontSize: "13px", fontWeight: 500 }}>{displayName(t.symbol)}</span>
                {/* the selected chip shows its cost too; hiding it left the one stock you chose blank */}
                {(
                  <span
                    style={{
                      display: "block",
                      fontSize: "10px",
                      marginTop: "2px",
                      opacity: 0.85,
                      color: active
                        ? "var(--bg)"
                        : cost === null || cost === undefined
                          ? "var(--text-dim)"
                          : cost > 1
                            ? "var(--signal)"
                            : "var(--text-dim)",
                    }}
                  >
                    {cost === undefined ? (
                      <span data-chip-loading aria-label="pricing" style={{ display: "inline-block", width: "28px", height: "3px", borderRadius: "2px", background: "currentColor", opacity: 0.35, verticalAlign: "middle", animation: "chip-pulse 1100ms ease-in-out infinite" }} />
                    ) : cost === null ? "—" : `${cost.toFixed(2)}%`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount selector with slider */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          how much to spend
        </div>
        <input
          type="number"
          value={amount}
          onChange={onAmountChange}
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
            boxSizing: "border-box",
          }}
        />
        <div style={{ position: "relative" }}>
          <input
            type="range"
            min="100"
            max="25000"
            step="100"
            value={amount}
            onChange={onSliderChange}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 8px",
              marginTop: "8px",
              fontSize: "10px",
              color: "var(--text-dim)",
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            <span>$100</span>
            <span>$12.5K</span>
            <span>$25K</span>
          </div>
          <p style={{ fontFamily: "Archivo, sans-serif", fontSize: "13px", color: "var(--text-dim)", margin: "10px 0 0" }}>
            Drag it up to see where this order gets blocked.
          </p>
        </div>
      </div>

      {/* Limit guard input */}
      <div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          block the trade if I overpay more than (%)
        </div>
        <input
          type="number"
          min="0"
          max="10"
          step="0.01"
          value={worstFillPct}
          onChange={(e) => onLimitChange(parseFloat(e.target.value))}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            color: "var(--text-primary)",
            fontFamily: '"JetBrains Mono", monospace',
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
