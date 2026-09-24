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

Three pages, all reading live.

**`/`: check an order.** Pick a stock, an amount and a limit. The page shows the extra cost of that
exact order in dollars: the price impact Jupiter returns for it, plus any Token-2022 transfer fee.
If the cost is over your limit, the trade is blocked and the page says what to do instead:
- buy less, with a one-click amount that passed two fresh quotes;
- split the order into three;
- what the same money costs in another stock.

It also lists what the issuer can do to your tokens, read from the mint. When a trade you place here
lands, the app opens that trade on `/proof`.

**`/census`: compare stocks.** Every tokenized stock we track, at $500, $5,000 and $25,000, ranked by
what the fill costs. One shared reading, refreshed every two minutes, with its age shown on the page.

**`/proof`: verify a trade.** Give it a transaction signature and it reads that transaction off
Solana, decodes what actually moved from the pre and post token balances, and prices it against the
real share, with the Solscan link so you can check it yourself.

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

Optional: set `SOLANA_RPC_URL` to a private RPC. Without it the app uses the public mainnet
endpoint, which is rate-limited and slow. The mint and transaction reads go through this app's own
server routes (`/api/mint`, `/api/tx`) because the public RPC refuses browser-origin requests.

Set `JUPITER_API_KEY` (a free key from the Jupiter portal) on the server. Every Jupiter call goes
through `/api/jup` and a paced queue (`src/lib/jupServer.ts`), so the key never reaches the browser
and the free tier's one request per second is never exceeded. Without a key it runs at half that rate.

## Stack

Next.js 14 (app router), TypeScript, Jupiter for quotes, prices and swaps, Solana RPC for mint
extensions and transactions, Solana web3.js loaded only at signing time.

## Status

Built and tested. The cost math has unit tests (`npm test`), and the acceptance scripts in
`scripts/` pass against live data at 390px and 1440px. Not yet proven: a trade signed through this
app on mainnet.
