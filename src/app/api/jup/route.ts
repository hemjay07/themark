import { NextResponse } from "next/server";
import { jupGet, jupHeaders, KEY, UPSTREAM } from "@/lib/jupServer";

export const dynamic = "force-dynamic";

// The browser never calls Jupiter directly. Every read comes through here and through the shared,
// paced queue in src/lib/jupServer.ts, so a burst from one page can't trip the plan's rate limit, and a
// person's own quote always runs ahead of the background census refresh. Nothing is cached after a call
// resolves: a number shown for an order is the answer to a call made for it.
const ALLOWED = ["/swap/v1/quote", "/price/v3", "/tokens/v2/search"];
const ALLOWED_POST = ["/swap/v1/swap"];

export async function GET(request: Request) {
  const u = new URL(request.url);
  const path = u.searchParams.get("path") ?? "";
  if (!ALLOWED.includes(path)) {
    return NextResponse.json({ error: "path not allowed" }, { status: 400 });
  }
  u.searchParams.delete("path");
  // the stock-chip scan marks itself low priority so a person's own quote and the advice run first
  const prio = u.searchParams.get("prio");
  const priority = prio === "low" ? "low" : prio === "mid" ? "mid" : "high";
  u.searchParams.delete("prio");
  const { status, body } = await jupGet(`${path}?${u.searchParams.toString()}`, priority);
  return new NextResponse(body, {
    status,
    // whether a key is configured, yes or no; the key itself never leaves the server
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "x-mark-keyed": KEY ? "1" : "0" },
  });
}

// Building the swap transaction goes through here too, so the key stays server-side. One call, at sign
// time, never retried: a swap build that fails is reported as failed.
export async function POST(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!ALLOWED_POST.includes(path)) {
    return NextResponse.json({ error: "path not allowed" }, { status: 400 });
  }
  const body = await request.text();
  const res = await fetch(`${UPSTREAM}${path}`, {
    method: "POST",
    headers: { ...jupHeaders(), "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "x-mark-keyed": KEY ? "1" : "0" },
  });
}
