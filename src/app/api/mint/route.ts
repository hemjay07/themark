import { NextResponse } from "next/server";
import { rpc } from "@/lib/solanaRpc";

export const dynamic = "force-dynamic";

// The public RPC refuses browser-origin requests (403), so the mint read happens here, server side,
// through the shared helper that retries and rotates endpoints. It returns only the Token-2022
// extension block; nothing is cached. An unanswered call is an error, never an empty list: reporting
// it as "no extensions" once made the page state "no transfer fee" about a call that never answered.
export async function GET(request: Request) {
  const mint = new URL(request.url).searchParams.get("mint");
  if (!mint) {
    return NextResponse.json({ error: "mint is required" }, { status: 400 });
  }
  try {
    const result = await rpc<{ value: any } | null>("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
    if (!result?.value) {
      return NextResponse.json({ error: "no such mint account" }, { status: 404 });
    }
    return NextResponse.json(
      { extensions: result.value.data?.parsed?.info?.extensions ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "rpc unreachable" }, { status: 502 });
  }
}
