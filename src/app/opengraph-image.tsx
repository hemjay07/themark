import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The social card is rendered when a platform fetches it, never baked. A static card carried a
// dated percentage, which breaks the founder's rule that nothing on a static asset may go stale.
// Here the figure is the answer to a quote made at the moment the card was requested; if that
// quote cannot be read, the card shows no figure at all rather than a remembered one.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "THE MARK: see what a tokenized stock order really costs before you sign";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ORDER_USD = 25000;
// The thin pools, where the cost is. Whichever answers with the highest impact at request time is
// the one the card names. A pool with no route right now is skipped, never guessed at.
const CANDIDATES = [
  { name: "Intel", mint: "XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM" },
  { name: "Palantir", mint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4" },
  { name: "OpenAI", mint: "oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ" },
];

async function impactFor(mint: string): Promise<number | null> {
  try {
    const key = process.env.JUPITER_API_KEY;
    const url = `https://api.jup.ag/swap/v1/quote?inputMint=${USDC}&outputMint=${mint}&amount=${
      ORDER_USD * 1e6
    }&slippageBps=50`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...(key ? { "x-api-key": key } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const impact = Number((await res.json()).priceImpactPct);
    return Number.isFinite(impact) ? Math.abs(impact) * 100 : null;
  } catch {
    return null;
  }
}

async function liveCost(): Promise<{ usd: number; pct: number; name: string } | null> {
  const reads = await Promise.all(CANDIDATES.map(async (c) => ({ name: c.name, pct: await impactFor(c.mint) })));
  const answered = reads.filter((r): r is { name: string; pct: number } => r.pct !== null);
  if (!answered.length) return null;
  const worst = answered.sort((a, b) => b.pct - a.pct)[0];
  return { name: worst.name, pct: worst.pct, usd: (ORDER_USD * worst.pct) / 100 };
}

export default async function Image() {
  const dir = join(process.cwd(), "src/app/og-fonts");
  const [regular, bold, mono, cost] = await Promise.all([
    readFile(join(dir, "Archivo-400.ttf")),
    readFile(join(dir, "Archivo-700.ttf")),
    readFile(join(dir, "JetBrainsMono-400.ttf")),
    liveCost(),
  ]);

  const red = "#C4261D";
  const ink = "#FAFAFA";
  const dim = "#71717A";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A0A0F",
          padding: "64px 72px",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* the icon's gate arm: a post, and a red bar across the lane */}
          <div style={{ display: "flex", position: "relative", width: 44, height: 44 }}>
            <div style={{ position: "absolute", left: 8, top: 2, width: 7, height: 40, background: ink }} />
            <div style={{ position: "absolute", left: 8, top: 16, width: 36, height: 9, background: red }} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: ink, letterSpacing: 1 }}>THE MARK</div>
        </div>

        {cost ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 176,
                lineHeight: 1,
                color: red,
                letterSpacing: -6,
              }}
            >
              {`$${Math.round(cost.usd).toLocaleString("en-US")}`}
            </div>
            <div style={{ fontSize: 40, color: ink, marginTop: 22 }}>
              {`in price impact alone, on a $25,000 ${cost.name} order. ${cost.pct.toFixed(2)}% gone before you own a share.`}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.02, color: ink }}>
              What does your order really cost?
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 28, color: dim, maxWidth: 700 }}>
            Tokenized stocks on Solana. It shows the real cost before you sign, and blocks the trade
            above your limit.
          </div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, color: dim, whiteSpace: "nowrap" }}>
            {cost ? "priced live when this card loaded" : "live pricing unavailable right now"}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: regular, weight: 400, style: "normal" },
        { name: "Archivo", data: bold, weight: 700, style: "normal" },
        { name: "JetBrains Mono", data: mono, weight: 400, style: "normal" },
      ],
      headers: { "Cache-Control": "no-store" },
    }
  );
}
