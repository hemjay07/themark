"use client";

import { useState } from "react";
import { getQuote } from "@/lib/jupiter";
import { TOKEN_LIST, getTokenBySymbol, USDC_MINT } from "@/lib/tokens";
import type { QuoteResult } from "@/lib/types";

interface QuoteFormProps {
  onQuote: (result: QuoteResult) => void;
  isLoading: boolean;
}

export function QuoteForm({ onQuote, isLoading }: QuoteFormProps) {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("SPYx");
  const [error, setError] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);

  const handleQuote = async () => {
    setError("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 10 || amountNum > 25000) {
      setError("Amount must be between $10 and $25,000");
      return;
    }

    const token = getTokenBySymbol(selectedToken);
    if (!token) {
      setError("Token not found");
      return;
    }

    setLoadingQuote(true);
    try {
      const amountInLamports = String(Math.floor(amountNum * 1e6));
      const quote = await getQuote(USDC_MINT, token.mint, amountInLamports);

      if (!quote) {
        setError("Could not fetch quote. Check Jupiter API status.");
        return;
      }

      onQuote(quote);
    } catch (err) {
      setError("Error fetching quote");
      console.error(err);
    } finally {
      setLoadingQuote(false);
    }
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-semibold text-amber-400">Get Quote</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Token</label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="input-field w-full"
        >
          {TOKEN_LIST.map((t) => (
            <option key={t.mint} value={t.symbol}>
              {t.symbol} ({t.name})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amount (USDC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 500"
          min="10"
          max="25000"
          step="1"
          className="input-field w-full"
          disabled={loadingQuote || isLoading}
        />
        <p className="text-xs text-zinc-500 mt-1">Min $10, max $25,000. Quoting is free; only signing spends.</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button
        onClick={handleQuote}
        disabled={loadingQuote || isLoading || !amount}
        className="gold-button w-full"
      >
        {loadingQuote ? "Fetching Quote..." : "Get Quote"}
      </button>
    </div>
  );
}
