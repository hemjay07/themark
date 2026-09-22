import type { Receipt } from "./types";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || "";

// Fallback to Solana Labs public RPC if Helius is rate-limited
const RPC_URL = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : SOLANA_RPC;

export async function confirmTransaction(
  signature: string,
  maxWaitMs: number = 60000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          method: "getSignatureStatuses",
          params: [[signature]],
        }),
      });

      const { result } = await res.json();
      if (result?.value?.[0]?.confirmationStatus === "finalized") {
        return true;
      }
    } catch (err) {
      console.error("Confirmation poll failed:", err);
    }

    // Wait 2 seconds before retry
    await new Promise((r) => setTimeout(r, 2000));
  }

  return false;
}

export async function parseTransaction(
  signature: string
): Promise<{
  inputAmount: number;
  outputAmount: number;
  fee: number;
} | null> {
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getParsedTransaction",
        params: [signature, { maxSupportedTransactionVersion: 0 }],
      }),
    });

    const { result } = await res.json();
    if (!result?.meta) {
      console.error("Could not parse transaction");
      return null;
    }

    // Simplified extraction - in production, would validate against route plan
    return {
      inputAmount: 0,
      outputAmount: 0,
      fee: result.meta.fee / 1e9,
    };
  } catch (err) {
    console.error("Transaction parsing failed:", err);
    return null;
  }
}

export function getSolscanLink(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}
