import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// The public RPC refuses browser-origin requests (403), so the mint read happens here, server side.
// It returns only the Token-2022 extension block; nothing is cached.
export async function GET(request: Request) {
  const mint = new URL(request.url).searchParams.get("mint");
  if (!mint) {
    return NextResponse.json({ error: "mint is required" }, { status: 400 });
  }

  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [mint, { encoding: "jsonParsed" }],
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `rpc ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    // The RPC answers 200 with an error body for a bad request. Reporting that as an empty
    // extension list made the page state "no transfer fee" as fact about a call that never
    // answered. An unanswered call is an error, not an absence.
    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "rpc error" },
        { status: 502 }
      );
    }
    if (!data.result?.value) {
      return NextResponse.json({ error: "no such mint account" }, { status: 404 });
    }
    return NextResponse.json(
      { extensions: data.result.value.data?.parsed?.info?.extensions ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "rpc unreachable" }, { status: 502 });
  }
}
