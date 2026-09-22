import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Every browser tab used to call lite-api.jup.ag directly, in bursts, and the public endpoint
// throttled us into "no read" rows, an empty fold, and a /proof demo that ended in "refusing to
// reconcile". All Jupiter reads now come through here: identical requests that are already in flight
// share one upstream call, at most two upstream calls run at once, and a 429 is retried with backoff
// before anything is reported as missing. Nothing is cached after it resolves: a number is still only
// ever the answer to a call made in that moment.
const UPSTREAM = "https://lite-api.jup.ag";
const ALLOWED = ["/swap/v1/quote", "/price/v3", "/tokens/v2/search"];
const MAX_CONCURRENT = 2;

const inflight = new Map<string, Promise<{ status: number; body: string }>>();
let active = 0;
const waiters: Array<() => void> = [];

async function slot() {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  await new Promise<void>((r) => waiters.push(r));
  active++;
}
function release() {
  active--;
  waiters.shift()?.();
}

async function upstream(url: string): Promise<{ status: number; body: string }> {
  await slot();
  try {
    let last = { status: 502, body: '{"error":"upstream unreachable"}' };
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
        last = { status: res.status, body: await res.text() };
        if (res.status !== 429 && res.status < 500) return last;
      } catch {
        // network error: retry
      }
      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, i)));
    }
    return last;
  } finally {
    release();
  }
}

export async function GET(request: Request) {
  const u = new URL(request.url);
  const path = u.searchParams.get("path") ?? "";
  if (!ALLOWED.includes(path)) {
    return NextResponse.json({ error: "path not allowed" }, { status: 400 });
  }
  u.searchParams.delete("path");
  const target = `${UPSTREAM}${path}?${u.searchParams.toString()}`;

  let p = inflight.get(target);
  if (!p) {
    p = upstream(target).finally(() => inflight.delete(target));
    inflight.set(target, p);
  }
  const { status, body } = await p;
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
