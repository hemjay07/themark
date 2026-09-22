"use client";

import { useState } from "react";
import type { QuoteResult, Receipt as ReceiptType } from "@/lib/types";
import { confirmTransaction, getSolscanLink } from "@/lib/helius";
import { getToken } from "@/lib/tokens";

interface RefusalGuardProps {
  quote: QuoteResult;
  worstFillPct: number;
  onWorstFillChange: (pct: number) => void;
  onApprove: () => void;
  onRefuse: () => void;
  isLoading: boolean;
  setReceipt: (receipt: ReceiptType | null) => void;
}

export function RefusalGuard({
  quote,
  worstFillPct,
  onWorstFillChange,
  onApprove,
  onRefuse,
  isLoading,
  setReceipt,
}: RefusalGuardProps) {
  const shouldRefuse = quote.allInCostPct > worstFillPct;
  const [approveLoading, setApproveLoading] = useState(false);

  const handleApprove = async () => {
    setApproveLoading(true);
    try {
      const phantom = (window as any)?.solana;
      if (!phantom) {
        alert("Phantom wallet not found");
        return;
      }

      if (!phantom.isConnected) {
        alert("Please connect Phantom wallet first");
        return;
      }

      const walletKey = phantom.publicKey.toString();
      const token = getToken(quote.outputMint);
      const tokenSymbol = token?.symbol || "Token";

      // For demo purposes, we'll create a mock receipt
      // In production, this would call Jupiter swap and wait for confirmation
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
        tokenSymbol,
        multiplier: quote.multiplier,
        transferFeePercentage: quote.transferFeePercentage,
      };

      setReceipt(mockReceipt);
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Approval failed: " + String(err));
    } finally {
      setApproveLoading(false);
    }
  };

  return (
    <div className={`card space-y-4 border-2 ${shouldRefuse ? "border-red-600" : "border-green-600"}`}>
      <h2 className="text-xl font-semibold text-amber-400">Set Your Limit</h2>

      {/* Quote Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-zinc-500">Reference Price</p>
          <p className="text-lg font-semibold">${quote.referencePrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-zinc-500">All-In Cost</p>
          <p className="text-lg font-semibold text-amber-400">
            ${quote.allInCostUsd.toFixed(2)} ({quote.allInCostPct.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Multiplier info if present */}
      {quote.multiplier !== 1 && (
        <div className="p-2 bg-zinc-800 rounded text-xs text-zinc-300">
          Multiplier applied: {quote.multiplier.toFixed(6)} ({((quote.multiplier - 1) * 100).toFixed(4)}%)
        </div>
      )}

      {/* Transfer fee info if present */}
      {quote.transferFeePercentage && quote.transferFeePercentage > 0 && (
        <div className="p-2 bg-zinc-800 rounded text-xs text-zinc-300">
          Transfer fee: {quote.transferFeePercentage.toFixed(2)} bps
        </div>
      )}

      {/* Worst-Fill Slider */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Worst Fill I'll Accept: {worstFillPct.toFixed(1)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="5.0"
          step="0.1"
          value={worstFillPct}
          onChange={(e) => onWorstFillChange(parseFloat(e.target.value))}
          className="w-full"
          disabled={isLoading || approveLoading}
        />
        <p className="text-xs text-zinc-500 mt-1">Higher % = accept worse fills</p>
      </div>

      {/* Refusal Warning */}
      {shouldRefuse && (
        <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
          <p className="text-red-400 font-semibold">⚠ STOP</p>
          <p className="text-sm text-red-300 mt-1">
            This order costs {quote.allInCostPct.toFixed(2)}%, which exceeds your limit of {worstFillPct.toFixed(1)}%.
          </p>
          <p className="text-xs text-red-200 mt-2">
            The system refuses. Reduce your order amount or increase your limit.
          </p>
        </div>
      )}

      {/* Approval UI */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRefuse}
          className={`py-2 px-4 rounded-lg font-semibold transition ${
            shouldRefuse
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
          }`}
          disabled={isLoading || approveLoading}
        >
          {shouldRefuse ? "⬤ REFUSE" : "Refuse"}
        </button>

        <button
          onClick={handleApprove}
          disabled={shouldRefuse || isLoading || approveLoading}
          className="gold-button"
        >
          {approveLoading ? "Signing..." : "Approve"}
        </button>
      </div>

      {!shouldRefuse && (
        <p className="text-xs text-green-400">✓ Safe to approve</p>
      )}
    </div>
  );
}
