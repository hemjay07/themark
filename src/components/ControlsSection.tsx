"use client";

import { TOKEN_LIST } from "@/lib/tokens";

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
        maxWidth: "800px",
        margin: "0 auto",
        padding: "0 24px 48px",
      }}
    >
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
                <span>{t.symbol}</span>
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
                    {cost === undefined ? "…" : cost === null ? "—" : `${cost.toFixed(2)}%`}
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
            min="10"
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
            <span>$10</span>
            <span>$5K</span>
            <span>$25K</span>
          </div>
        </div>
      </div>

      {/* Limit guard input */}
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
