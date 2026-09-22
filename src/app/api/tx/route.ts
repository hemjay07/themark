import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// The public RPC refuses browser-origin requests (403), so the transaction read happens here,
// server side, exactly like the /api/mint route. Nothing is cached: every reconciliation is
// read off the chain at request time.
export async function GET(request: Request) {
  const signature = new URL(request.url).searchParams.get("signature");
  if (!signature) {
    return NextResponse.json({ error: "signature is required" }, { status: 400 });
  }

  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `rpc ${res.status}` }, { status: 502 });
    }

    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "rpc refused this signature" },
        { status: 502 }
      );
    }
    if (!data.result) {
      return NextResponse.json({ error: "signature not found on mainnet" }, { status: 404 });
    }

    return NextResponse.json(
      { transaction: data.result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "rpc unreachable" }, { status: 502 });
  }
}
