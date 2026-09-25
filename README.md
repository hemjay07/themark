# THE MARK: what a tokenized stock really costs, before you buy it

THE MARK prices your exact order in the exact pool it will fill in, on Solana, and stamps it BLOCKED if the extra cost is over the limit you set. Every figure is a live Jupiter quote plus the token's own on-chain fee, read at the moment you look. It also reads any wallet's trades off the chain and totals what that wallet already paid over.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-22_passing-brightgreen)](#testing)

**Live:** [themark-nine.vercel.app](https://themark-nine.vercel.app)

---

![THE MARK](docs/images/landing.png)

## Live Demo
**[themark-nine.vercel.app](https://themark-nine.vercel.app)**
Open Check, pick a stock, drag the amount to $25,000 and watch the ticket get stamped BLOCKED. Click "Cut to $X" and the ticket tears down to the largest size that fits under your line.

---

## What Is THE MARK?

Tokenized stocks on Solana trade in pools that are thin at the wrong hours. A price chart shows the token's price. It does not show what your order will cost to fill: the price moving against you in the pool, plus a transfer fee some tokens charge on every move. THE MARK shows that number for your exact order, refuses the trade when it is over your limit, and tells you what to do instead.

The gap between a tokenized stock and the real share, the number most dashboards chart, measured a median 0.20% across 20 pairs on 22 September 2026. On the same day, a $25,000 order cost between 0.06% and 2.56% to fill depending on the stock. The fill is where the money goes.

---

## Screenshots
| Check: the ticket is the app | Compare: the field against your line |
|------|------|
| ![Check](docs/images/check.png) | ![Compare](docs/images/compare.png) |

| Verify: a wallet printed as a ledger |
|------|
| ![Verify](docs/images/verify.png) |

---

## Features
- **The ticket is the app**: pick a stock from the stubs printed on it, set the amount on its line and your limit on the line itself. The cost of that exact order prints in dollars, from a live quote.
- **Stamped before you sign**: over your limit the ticket is stamped BLOCKED and the order never reaches your wallet. Under it, CLEARS, and your wallet signs.
- **The cut**: when blocked, one click cuts the order to the largest size that fits (checked with two fresh quotes). The ticket tears and the smaller one is revealed.
- **Watch the line**: leave a blocked ticket open and it re-quotes every 30 seconds. The moment the cost fits under your line it clears, with a browser notification.
- **The field against your line**: every stock at $500, $5,000 and $25,000, drawn against the limit you set. Red over it, green under, with the finding in one sentence.
- **Were you the mark?**: paste any wallet address. Every tokenized-stock trade it made is read off the chain, priced against the real share and totalled, with a verdict stamped against a 1% line, plus what it holds now and the toll for selling it all today.
- **What the issuer can do**: each token's Token-2022 settings are read from the mint. If the issuer can take tokens from your wallet, pause trading or run code on every transfer, the ticket says so.
- **A ticket is a link**: the stock, amount and limit live in the URL, so a ticket can be shared.

---

## How It Works

```
 browser                          server (Next.js routes)              outside
 ───────                          ───────────────────────              ───────
 /check  ── quote this order ──▶  /api/jup  ── paced queue (1 req/s) ─▶ Jupiter quote + price
   │                                  │         high / mid / low lanes
   │◀── cost, route, fee ─────────────┘
   │
   ├── issuer powers ────────────▶  /api/mint ── endpoint rotation ────▶ Solana RPC (mint account)
   │
   ├── over the limit? ─▶ BLOCKED, cut, or watch (client only)
   └── under? ─▶ Phantom signs ─▶ lands ─▶ /proof?sig=…

 /census ── one shared reading ─▶  /api/census ── 24 quotes, cached 2 min, age shown
 /proof  ── a wallet ───────────▶  /api/wallet ── token accounts → signatures → transactions → priced
```

### The cost of an order
| Part | Source | Note |
|------|--------|------|
| Price impact | Jupiter `/swap/v1/quote` for the exact amount | a fraction, shown as % of the order |
| Transfer fee | `transferFeeConfig` on the Token-2022 mint | Tessera's OpenAI, Kalshi and SpaceX charge 0.20% |
| Balance multiplier | `scaledUiAmountConfig` on the mint, the newer value once in force | xStocks grow balances instead of paying dividends |
| Reference price | the real share for public companies; the token's own price for private ones | the page says which it used |

### What is never shown
No sample data, no placeholder price, no remembered number. When a call fails, the page says so and shows nothing in its place. The one shared reading is the census, cached for two minutes and labelled with its age. Prices for past trades are read now, not at the moment of the trade, and the ledger says so.

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (app router), React 18, TypeScript |
| Quotes and prices | Jupiter API, through a server-side paced queue |
| Chain reads | Solana JSON-RPC (public endpoints with rotation, or your own) |
| Wallet | Phantom, via `@solana/web3.js` loaded at signing time |
| Tests | Jest (cost math), Playwright acceptance scripts against live data |
| Hosting | Vercel |

---

## Testing

```bash
npm test
# Result: 22/22 passing
```
The unit tests cover the cost math: the price-impact conversion, the transfer fee, the balance multiplier (including the newer value once its timestamp passes), route parsing and the fill cost. The five scripts in `scripts/` open the running app in a real browser at 1440 px and 390 px and check each page against its spec, using live quotes.

```bash
npm run build && npm start          # port 3991
node scripts/check-v5.mjs http://localhost:3991
```

---

## Try It (3 minutes)
1. Go to [themark-nine.vercel.app/check](https://themark-nine.vercel.app/check).
2. Click a stock stub at the top of the ticket. Drag the amount to $25,000. The cost prints and the ticket is stamped.
3. Type a limit into "YOUR LIMIT" on the line. Watch the stamp change between BLOCKED and CLEARS.
4. On a blocked ticket, click "Cut to $X". The ticket tears and the smaller order clears. Or click "Watch the line" and leave the tab open.
5. To place a cleared order, connect Phantom (top right) and click "Place this order". When it lands, the app opens the trade's own proof page.
6. Go to [Verify](https://themark-nine.vercel.app/proof) and click "Try a real wallet" to read a wallet's trades off the chain.

---

## API Reference
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jup?path=/swap/v1/quote&…` | A Jupiter quote, through the paced queue. `prio=mid` or `low` for background work. |
| GET | `/api/jup?path=/price/v3&ids=…` | Prices and mint configs for a comma-separated list of mints. |
| POST | `/api/jup?path=/swap/v1/swap` | Builds the swap transaction for a quote. Never retried. |
| GET | `/api/mint?mint=…` | The Token-2022 extensions of a mint. |
| GET | `/api/tx?signature=…` | A parsed transaction. |
| GET | `/api/census` | Every stock at three sizes. One shared reading, refreshed every two minutes. |
| GET | `/api/wallet?address=…` | Every tokenized-stock trade of a wallet, priced, with holdings and the exit toll. |

---

## Running Locally

```bash
git clone https://github.com/hemjay07/themark.git
cd themark
npm install
npm run dev          # http://localhost:3000
```

### Required Environment Variables
| Variable | Description |
|----------|-------------|
| `JUPITER_API_KEY` | Optional. A free key from the Jupiter portal. Without it the app runs at half the request rate. Server-side only. |
| `SOLANA_RPC_URL` | Optional. A private RPC URL. Without it the app rotates between two public endpoints. |

---

## Project Structure
```
src/
  app/
    page.tsx              # the story: nine scenes
    check/page.tsx        # Check: the ticket is the app
    census/page.tsx       # Compare: the field against your line
    proof/                # Verify: a trade as a receipt, a wallet as a ledger
    api/                  # jup, mint, tx, census, wallet
  components/
    TradeTicket.tsx       # the ticket, its stamp, its foot
    TicketControls.tsx    # the stubs, the amount line
    TicketCut.tsx         # the tear
    LimitLine.tsx         # the line, with the limit typed on it
    Advice.tsx            # the other ways out
    landing/              # the story's scenes, the strip, the rail
  lib/
    jupiter.ts            # quotes, prices, the cost math
    jupServer.ts          # the paced queue with three lanes
    solanaRpc.ts          # endpoint rotation for chain reads
    tokens.ts             # the eight stocks, the reference-price rule
    tx.ts                 # reading a trade off the chain
scripts/                  # acceptance scripts, run against the live app
```

---

Built for the [Stocklana](https://stocklana.com) hackathon (tokenized stocks on Solana).

## License
MIT
