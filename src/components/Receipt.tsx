"use client";

import type { Receipt as ReceiptType } from "@/lib/types";

interface ReceiptProps {
  receipt: ReceiptType;
  onNewOrder: () => void;
}

export function Receipt({ receipt, onNewOrder }: ReceiptProps) {
  return (
    <div className="card border-2 border-green-600 space-y-4">
      <div className="text-center">
        <p className="text-4xl mb-2">✓</p>
        <h2 className="text-2xl font-bold text-green-400">RECEIPT</h2>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-zinc-500">Filled at</p>
          <p className="text-lg font-semibold">${receipt.filledPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-zinc-500">Reference</p>
          <p className="text-lg font-semibold">${receipt.referencePrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-zinc-500">You Paid</p>
          <p className="text-lg font-semibold">${receipt.amountInUsdc.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-zinc-500">You Received</p>
          <p className="text-lg font-semibold">{receipt.amountOutTokens.toFixed(2)} {receipt.tokenSymbol}</p>
        </div>
      </div>

      {/* Multiplier info if present */}
      {receipt.multiplier !== 1 && (
        <div className="p-2 bg-zinc-800 rounded text-xs text-zinc-300">
          Multiplier applied: {receipt.multiplier.toFixed(6)}
        </div>
      )}

      {/* Transfer fee info if present */}
      {receipt.transferFeePercentage && receipt.transferFeePercentage > 0 && (
        <div className="p-2 bg-zinc-800 rounded text-xs text-zinc-300">
          Transfer fee deducted: {receipt.transferFeePercentage.toFixed(2)} bps
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="p-3 bg-zinc-900 rounded-lg text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-zinc-400">Cost above reference:</span>
          <span className="text-amber-400 font-semibold">
            ${receipt.costAboveReference.toFixed(2)} ({receipt.costAboveReferencePct.toFixed(2)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Saved vs worst-case:</span>
          <span className="text-green-400 font-semibold">
            ${receipt.savedVsWorstCase.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Solscan Link */}
      {receipt.solscanLink !== "#" && (
        <a
          href={receipt.solscanLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center py-3 bg-blue-900 hover:bg-blue-800 text-blue-300 rounded-lg font-semibold transition"
        >
          View on Solscan →
        </a>
      )}

      {/* New Order Button */}
      <button
        onClick={onNewOrder}
        className="w-full py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
      >
        New Order
      </button>

      <p className="text-xs text-zinc-500 text-center">
        Timestamp: {new Date(receipt.timestamp).toLocaleString()}
      </p>
    </div>
  );
}
