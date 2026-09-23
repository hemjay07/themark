import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { jupGet } from "@/lib/jupServer";
import { TOKEN_LIST, USDC_MINT } from "@/lib/tokens";
import { CENSUS_SIZES } from "@/lib/censusSizes";

// The reading is taken on request, never at build (a build shares the key's org-wide 1 req/s limit with
// any running server and timed out), and kept in Next's data cache for two minutes, which holds across
// serverless instances where in-process memory does not. One reading takes ~26s at 1 request a second.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The census is ONE shared reading, rebuilt on the server at most every two minutes, shown to every visitor
// with its age. On the free Jupiter key (1 request a second) a census computed per visitor took about 26
// seconds to fill, so a judge saw empty rows; the founder chose not to pay for a higher plan. Every
// figure is still the answer to a live call; what changes is that it is labelled with when that call
// was made. The instrument on / stays live per order. Recorded in design/CHARTER.md.
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

type Cell = { ok: true; pct: number } | { ok: false; reason: string };
type Snapshot = {
  startedAt: number;
  finishedAt: number | null;
  cells: Record<string, Record<string, Cell>>;
};

async function transferFeePct(mint: string): Promise<number | null> {
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getAccountInfo", params: [mint, { encoding: "jsonParsed" }] }),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.error || !data.result?.value) return null;
    const ext: Array<{ extension: string; state: any }> = data.result.value.data?.parsed?.info?.extensions ?? [];
    const bps = ext.find((e) => e.extension === "transferFeeConfig")?.state?.newerTransferFee?.transferFeeBasisPoints;
    return typeof bps === "number" ? bps / 100 : 0;
  } catch {
    return null;
  }
}

async function takeReading(): Promise<Snapshot> {
  const snap: Snapshot = { startedAt: Date.now(), finishedAt: null, cells: {} };
  for (const token of TOKEN_LIST) {
    snap.cells[token.mint] = {};
    const fee = await transferFeePct(token.mint);
    for (const size of CENSUS_SIZES) {
      const { status, body } = await jupGet(
        `/swap/v1/quote?inputMint=${USDC_MINT}&outputMint=${token.mint}&amount=${size.amountIn}&slippageBps=50`,
        "low"
      );
      let cell: Cell;
      try {
        const impact = Number(JSON.parse(body).priceImpactPct);
        if (status !== 200 || !Number.isFinite(impact)) {
          cell = { ok: false, reason: status === 400 ? "no route for this size" : `quote ${status}` };
        } else if (fee === null) {
          // the fee could not be read, so a cost here could silently omit it: show nothing instead
          cell = { ok: false, reason: "token fee could not be read" };
        } else {
          cell = { ok: true, pct: Math.abs(impact) * 100 + fee };
        }
      } catch {
        cell = { ok: false, reason: "unreadable quote" };
      }
      snap.cells[token.mint][size.key] = cell;
    }
  }
  snap.finishedAt = Date.now();
  return snap;
}

const cachedReading = unstable_cache(takeReading, ["census-reading-v1"], { revalidate: 120 });

export async function GET() {
  const snap = await cachedReading();
  return NextResponse.json({ readAt: snap.finishedAt, complete: true, cells: snap.cells });
}
