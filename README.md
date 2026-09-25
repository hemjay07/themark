# THE MARK

**Don't be the mark.** THE MARK shows what a tokenized stock really costs you before you buy it on
Solana, and stops the trade if that cost is more than you allow.

![THE MARK](public/brand/og.png)

---

## The problem, with numbers

Holders of tokenized stocks trade at two in the morning, when the books are thinnest, and nothing
tells them what their order costs.

The field's answer is the read-only dashboard: we counted 14 named public repos in this hackathon
building one, and the number most of them surface is the *gap* between a tokenized stock and the
real share. We measured that gap on 2026-09-22 across 20 pairs: a median of **0.20%**. It is not
where the money goes.

The money goes into the **fill**: the price impact your specific order pays in the specific pool it
routes through. Read live from Jupiter on 2026-09-22 at 19:36 UTC, on a $25,000 order. These are a snapshot; the
`/census` page recomputes them every time it loads:

| token | fill cost |
|---|---|
| INTCx (Intel) | 2.56% |
| PLTRx (Palantir) | 1.56% |
| tOpenAI | 1.74% |
| SPYx (S&P 500) | 0.06% |

That is a spread of roughly 40x between the best and worst pool, on the same order size, in the same
minute. None of it is visible before you sign.

## What this does

Four pages, all reading live.

**`/`: the story.** Nine screens, one statement each: the same $25,000 order priced across all eight
stocks, the count of tokens whose issuer can take them out of your wallet, a real purchase priced off
the chain. Every figure is live or carries its date.

**`/check`: check an order.** Pick a stock, an amount and a limit. The order prints on a ticket with
the extra cost of that exact order in dollars: the price impact Jupiter returns for it, plus any
Token-2022 transfer fee. Over your limit it is stamped BLOCKED and never reaches your wallet; under
it, CLEARS, and your wallet signs. When blocked, the page offers the largest size that fits (checked
twice), a split into three, and a cheaper stock. The issuer's powers over the token are read from the
mint. A trade you place here opens its own `/proof` page when it lands.

**`/census`: compare stocks.** Every tokenized stock we track, at $500, $5,000 and $25,000, ranked by
what the fill costs. One shared reading, refreshed every two minutes, with its age shown on the page.

**`/proof`: were you the mark?** Paste a trade's signature, or a wallet address. A signature is read
off Solana, decoded from the pre and post token balances, and priced against the real share. A wallet
gets every tokenized-stock trade it ever made, priced the same way and totalled, then what it holds
now and what selling it all today would cost. Nothing is stored. Public companies are measured against
the real share price; private ones (OpenAI, Kalshi, SpaceX) against the token's own price, because
their "stock price" is a valuation mark the token trades far from, and the page says which it used.

## The on-chain finding

xStocks are Token-2022 mints carrying a `scaledUiAmountConfig`. The multiplier there changes how
many units a wallet displays, so a cost computed without it is wrong. Tessera's t-tokens carry a
`transferFeeConfig` instead: tOpenAI charges 20 basis points on transfer, which no price feed
includes. THE MARK reads both off the mint account at quote time and puts them in the cost.

`/proof` prints the live extension state for every mint, so the claim is checkable rather than
asserted.

## Rules this codebase follows

Three bans, enforced in review and visible in the code:

1. **No figure on a surface that was not returned by a call made in that moment.** No sample data,
   no placeholder price, no remembered number. When a call fails, the surface says so and shows
   nothing in its place. The one shared reading is `/census`, cached for two minutes and labelled
   with its age. There is no fallback price anywhere.
2. **No chart of the token-vs-share gap.** It is 0.20% and everyone else is drawing it.
3. **No green arrow, no confetti, no celebration of a trade.** The product's whole claim is that it
   tells you the cost.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests for the cost math
npm run build && npm start
```

Optional: set `SOLANA_RPC_URL` to a private RPC. Without it the app rotates between two public
endpoints (`src/lib/solanaRpc.ts`): the default mainnet endpoint allows about ten transaction reads
per ten seconds, publicnode reads thirty in under two seconds but needs a token for address history.
Chain reads go through this app's own routes (`/api/mint`, `/api/tx`, `/api/wallet`) because the
public endpoints refuse browser-origin requests.

Set `JUPITER_API_KEY` (a free key from the Jupiter portal) on the server. Every Jupiter call goes
through `/api/jup` and a paced queue (`src/lib/jupServer.ts`), so the key never reaches the browser
and the free tier's one request per second is never exceeded. Without a key it runs at half that rate.

## Stack

Next.js 14 (app router), TypeScript, Jupiter for quotes, prices and swaps, Solana RPC for mint
extensions and transactions, Solana web3.js loaded only at signing time.

## Status

Built and tested. The cost math has unit tests (`npm test`), and the four acceptance scripts in
`scripts/` (`check-v3`, `check-v31`, `check-proof`, `check-v4`) pass against live data at 390px and
1440px. Not yet proven: a trade signed through this
app on mainnet.
