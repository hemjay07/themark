import { NextResponse } from "next/server";
import { rpc } from "@/lib/solanaRpc";

export const dynamic = "force-dynamic";

// The public RPC refuses browser-origin requests (403), so the transaction read happens here, server
// side, through the shared helper that retries and rotates endpoints. Nothing is cached: every
// reconciliation is read off the chain at request time.
export async function GET(request: Request) {
  const signature = new URL(request.url).searchParams.get("signature");
  if (!signature) {
    return NextResponse.json({ error: "signature is required" }, { status: 400 });
  }
  try {
    const result = await rpc<any>("getTransaction", [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
    if (!result) {
      return NextResponse.json({ error: "signature not found on mainnet" }, { status: 404 });
    }
    return NextResponse.json({ transaction: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "rpc unreachable" }, { status: 502 });
  }
}
