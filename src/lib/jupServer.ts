// Server-only. Every call this app makes to Jupiter goes through here, paced to the plan's rate so we
// never trip a 429 and pay for it in backoff. Interactive calls (a person's own order) always jump ahead
// of background work (the shared census refresh).
//
// Free key: 1 req/s shared across Swap, Price and Token (developers.jup.ag/docs/portal/rate-limits.md).
// Keyless: 0.5 req/s. JUP_RPS overrides both if the plan changes.

export const UPSTREAM = "https://api.jup.ag";
export const KEY = process.env.JUPITER_API_KEY;
const RPS = Number(process.env.JUP_RPS) || (KEY ? 1 : 0.5);
const SPACING_MS = Math.ceil(1000 / RPS) + 50;

export const jupHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(KEY ? { "x-api-key": KEY } : {}),
});

// Three lanes. A visitor's own quote must never wait behind anyone's advice checks, or a second
// visitor sees an empty page while the first visitor's advice runs.
type Job = () => void;
export type Priority = "high" | "mid" | "low";
const high: Job[] = [];
const mid: Job[] = [];
const low: Job[] = [];
let lastStart = 0;
let pumping = false;

function pump() {
  if (pumping) return;
  pumping = true;
  const tick = () => {
    const job = high.shift() ?? mid.shift() ?? low.shift();
    if (!job) {
      pumping = false;
      return;
    }
    const wait = Math.max(0, lastStart + SPACING_MS - Date.now());
    setTimeout(() => {
      lastStart = Date.now();
      job();
      tick();
    }, wait);
  };
  tick();
}

function slot(priority: Priority): Promise<void> {
  return new Promise((resolve) => {
    (priority === "high" ? high : priority === "mid" ? mid : low).push(resolve);
    pump();
  });
}

// identical in-flight GETs share one upstream call
const inflight = new Map<string, Promise<{ status: number; body: string }>>();

export function jupGet(
  pathAndQuery: string,
  priority: Priority = "high"
): Promise<{ status: number; body: string }> {
  const url = `${UPSTREAM}${pathAndQuery}`;
  const existing = inflight.get(url);
  if (existing) return existing;
  const p = (async () => {
    let last = { status: 502, body: '{"error":"upstream unreachable"}' };
    for (let i = 0; i < 4; i++) {
      await slot(priority);
      try {
        const res = await fetch(url, { headers: jupHeaders(), cache: "no-store" });
        last = { status: res.status, body: await res.text() };
        if (res.status !== 429 && res.status < 500) return last;
      } catch {
        // network error: retry on the next slot
      }
    }
    return last;
  })().finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}
