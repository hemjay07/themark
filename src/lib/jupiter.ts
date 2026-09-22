import type { Price, QuoteResult } from "./types";
import { USDC_MINT, getToken } from "./tokens";

const JUPITER_BASE_URL = "https://lite-api.jup.ag";
const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6";

interface MintExtensions {
  scaledUiAmountConfig?: {
    interestRateConfig?: {
      currentInterestRate?: string;
      interestRateUpdateTimestamp?: number;
    };
    decimals?: number;
    multiplier?: string;
  };
  transferFeeConfig?: {
    transferFeeConfigAuthority?: string;
    withheldAmount?: string;
    transferFeeBasisPoints?: number;
    maximumFee?: string;
  };
}

// Fetch mint account info to read extensions (scaledUiAmountConfig, transferFeeConfig)
export async function getMintExtensions(
  mint: string,
  rpcUrl: string = "https://api.mainnet-beta.solana.com"
): Promise<MintExtensions> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [mint, { encoding: "jsonParsed" }],
      }),
    });

    const data = await res.json();
    if (data.result?.data?.parsed?.extensions) {
      return data.result.data.parsed.extensions;
    }
    return {};
  } catch (err) {
    console.error("Failed to fetch mint extensions:", err);
    return {};
  }
}

// Extract multiplier from scaledUiAmountConfig
export function getMultiplier(extensions: MintExtensions): number {
  const config = extensions.scaledUiAmountConfig;
  if (config?.interestRateConfig) {
    const multiplierStr = config.interestRateConfig.currentInterestRate;
    if (multiplierStr) {
      try {
        return parseFloat(multiplierStr) / Math.pow(10, 18);
      } catch {
        return 1;
      }
    }
  }
  return 1;
}

// Extract transfer fee percentage
export function getTransferFeePercentage(extensions: MintExtensions): number {
  const config = extensions.transferFeeConfig;
  if (config?.transferFeeBasisPoints) {
    return config.transferFeeBasisPoints / 100; // Convert basis points to percentage
  }
  return 0;
}

export async function fetchPrices(mints: string[]): Promise<Record<string, Price>> {
  const params = new URLSearchParams();
  mints.forEach((m) => params.append("ids", m));

  try {
    const res = await fetch(`${JUPITER_BASE_URL}/price/v3?${params}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      console.warn(`Jupiter price error: ${res.status}`);
      return {};
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Jupiter price fetch failed:", err);
    return {};
  }
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amountIn: string,
  slippageBps: number = 50
): Promise<QuoteResult | null> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amountIn,
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: "false",
    asLegacyTransaction: "false",
  });

  try {
    const res = await fetch(`${JUPITER_QUOTE_URL}/quote?${params}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      console.error(`Quote failed: ${res.status}`);
      return null;
    }

    const quoteData = await res.json();

    // Fetch prices to get reference price
    const prices = await fetchPrices([outputMint]);
    const price = prices[outputMint];

    if (!price) {
      console.error("Could not fetch price for reference");
      return null;
    }

    // Fetch mint extensions for multiplier and transfer fees
    const extensions = await getMintExtensions(outputMint);
    const multiplier = getMultiplier(extensions);
    const transferFeePercentage = getTransferFeePercentage(extensions);

    const referencePrice = price.stockData?.price || price.price;
    const token = getToken(outputMint);
    const decimals = token?.decimals || price.decimals || 6;

    // Raw token amount from quote
    const amountOutRaw = parseInt(quoteData.outAmount);

    // Apply multiplier to get UI amount (amount user sees in wallet)
    const amountOutTokens = (amountOutRaw / Math.pow(10, decimals)) * multiplier;

    const amountInUsd = parseInt(amountIn) / Math.pow(10, 6); // USDC = 6 decimals
    const shareValueUsd = amountOutTokens * referencePrice;

    // All-in cost: what user pays minus what they get (in USD terms)
    let allInCostUsd = amountInUsd - shareValueUsd;

    // Add transfer fee to all-in cost if present
    if (transferFeePercentage > 0) {
      const transferFeeAmount = (amountInUsd * transferFeePercentage) / 100;
      allInCostUsd += transferFeeAmount;
    }

    const allInCostPct = (allInCostUsd / amountInUsd) * 100;

    return {
      inputMint,
      outputMint,
      inAmount: amountIn,
      outAmount: quoteData.outAmount,
      priceImpactPct: quoteData.priceImpactPct || 0,
      referencePrice,
      onChainPrice: price.price,
      amountInUsd,
      amountOutTokens,
      allInCostUsd,
      allInCostPct,
      multiplier,
      transferFeePercentage: transferFeePercentage > 0 ? transferFeePercentage : undefined,
    };
  } catch (err) {
    console.error("Quote fetch failed:", err);
    return null;
  }
}

export async function getSwapTransaction(
  quoteResult: any,
  walletPublicKey: string
): Promise<string | null> {
  try {
    const res = await fetch(`${JUPITER_QUOTE_URL}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quoteResult,
        userPublicKey: walletPublicKey,
        wrapAndUnwrapSol: true,
      }),
    });

    if (!res.ok) {
      console.error(`Swap transaction creation failed: ${res.status}`);
      return null;
    }

    const { swapTransaction } = await res.json();
    return swapTransaction; // base64-encoded tx
  } catch (err) {
    console.error("Swap transaction fetch failed:", err);
    return null;
  }
}
