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

One product, three instruments, and a story that sells them.

**`/`: the story.** Nine screens that snap one at a time: the ticket printing and being stamped
BLOCKED, then cut to the size that fits and stamped CLEARS; the gap everyone charts against the
live fill; the field as a strip of paper stubs you scroll along; the count of tokens whose issuer
can take them from your wallet; a real purchase priced off the chain. Every figure is live or
carries its date.

**`/check`: Check.** The ticket is the app. The stock is a row of stubs across its top, each with
its live cost; the amount is on the amount line; your limit is typed into the line's own label.
Then what the order costs, the line, the stamp. Blocked, the foot offers **Cut to $X**, the largest
size that fits (the ticket tears and the smaller one is revealed), and **Watch the line**: the
order is re-quoted every 30 seconds and the ticket clears, with a browser notification, the
moment it fits. Clears, the foot places the order. The other ways out (a split, a cheaper stock)
hang off the ticket as torn stubs. A ticket is a link: its stock, amount and limit live in the URL.

**`/census`: Compare.** The field against your line: every stock at $500, $5,000 and $25,000 as
bars drawn against the limit you set, red over it, green under, with the finding in a sentence.
One shared reading, refreshed every two minutes, with its age on the page.

**`/proof`: Verify.** One box takes a trade's receipt code or a wallet address. A trade prints as a
receipt on paper, priced against the real share. A wallet prints as a ledger: every tokenized-stock
trade it made, priced and totalled, a verdict stamped against a 1% line, what it holds now and the
toll for selling it all today. Public companies are measured against the real share price; private
ones (OpenAI, Kalshi, SpaceX) against the token's own price, and the page says which. Nothing is
stored.

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

Built and tested. The cost math has unit tests (`npm test`), and the five acceptance scripts in
`scripts/` (`check-v3`, `check-v31`, `check-proof`, `check-v4`, `check-v5`) pass against live data
at 390px and 1440px. The design record is in `design/` (PRD-V5, CREATIVE, the assessments). Not yet proven: a trade signed through this
app on mainnet.
