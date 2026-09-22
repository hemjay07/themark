"use client";

import { useState } from "react";
import { QuoteForm } from "@/components/QuoteForm";
import { RefusalGuard } from "@/components/RefusalGuard";
import { Receipt } from "@/components/Receipt";
import { WalletConnect } from "@/components/WalletConnect";
import type { QuoteResult, Receipt as ReceiptType } from "@/lib/types";

export default function Home() {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [worstFillPct, setWorstFillPct] = useState(1.5);
  const [loading, setLoading] = useState(false);

  const handleQuote = async (result: QuoteResult) => {
    setQuote(result);
    setReceipt(null);
  };

  const handleApprove = async () => {
    if (!quote) return;
    setLoading(true);
    try {
      // This is handled by WalletConnect component (Phantom signing)
      // After tx is confirmed, receipt is set externally
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefuse = () => {
    setQuote(null);
    setReceipt(null);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold text-amber-400 mb-4">THE MARK</h1>
        <p className="text-xl text-zinc-300 mb-2">
          Know the real cost before you sign
        </p>
        <p className="text-zinc-400">
          Tokenized stocks are silently expensive. See the fill cost. Set your limit. Or refuse.
        </p>
      </section>

      {/* Main Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input & Quote */}
        <div className="space-y-4">
          <WalletConnect />
          <QuoteForm onQuote={handleQuote} isLoading={loading} />
        </div>

        {/* Right: Guard & Receipt */}
        <div className="space-y-4">
          {quote && !receipt && (
            <RefusalGuard
              quote={quote}
              worstFillPct={worstFillPct}
              onWorstFillChange={setWorstFillPct}
              onApprove={handleApprove}
              onRefuse={handleRefuse}
              isLoading={loading}
              setReceipt={setReceipt}
            />
          )}

          {receipt && (
            <Receipt receipt={receipt} onNewOrder={() => setReceipt(null)} />
          )}

          {!quote && !receipt && (
            <div className="p-8 bg-zinc-900 rounded-lg text-center text-zinc-400">
              <p>Enter an amount to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-zinc-900 rounded-lg">
          <h3 className="text-lg font-semibold text-amber-400 mb-2">Share Price</h3>
          <p className="text-sm text-zinc-400">
            Real share price from Jupiter (stockData.price, updated ~10s even pre-market)
          </p>
        </div>
        <div className="p-6 bg-zinc-900 rounded-lg">
          <h3 className="text-lg font-semibold text-amber-400 mb-2">All-In Cost</h3>
          <p className="text-sm text-zinc-400">
            Price impact + fees, shown before you sign. Up to 1.87% on thin books.
          </p>
        </div>
        <div className="p-6 bg-zinc-900 rounded-lg">
          <h3 className="text-lg font-semibold text-amber-400 mb-2">On-Chain Proof</h3>
          <p className="text-sm text-zinc-400">
            Receipt with Solscan link. Verify every transaction live.
          </p>
        </div>
      </section>
    </div>
  );
}
