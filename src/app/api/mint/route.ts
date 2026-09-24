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
    // The public RPC refuses bursts (429) now and then. Retry with backoff before reporting the read
    // as failed, so one refusal does not turn into "powers unknown" on the page.
    let res: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
      res = await fetch(RPC_URL, {
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
      if (res.status !== 429 && res.status < 500) break;
    }
    if (!res) throw new Error("rpc unreachable");

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
