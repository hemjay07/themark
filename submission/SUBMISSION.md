# THE MARK: Stocklana submission

**One line.** THE MARK shows what a tokenized stock really costs you before you buy it on Solana, stops the trade if that cost is more than you allow, and reads any wallet's trades off the chain to show what it already paid over.

## Links
- Live demo: https://themark-nine.vercel.app
- Repository: _(pending publish)_
- Demo video: _(pending)_

## What it does
1. **The story** (`/`). Nine screens, one statement each, every figure live: the same $25,000 order priced across all eight stocks, the count of tokens whose issuer can take them from your wallet, a real purchase priced off the chain.
2. **Check an order** (`/check`). Pick a stock, an amount and a limit. The order prints on a ticket with its extra cost in dollars, from a live Jupiter quote plus any Token-2022 transfer fee. Over your limit it is stamped BLOCKED and never reaches your wallet; under it, CLEARS and your wallet signs. When blocked, it offers the largest size that fits (checked twice), a split, and a cheaper stock. The issuer's powers over the token are read from the mint.
3. **Compare stocks** (`/census`). Every stock at $500, $5,000 and $25,000, one shared reading refreshed every two minutes, with its age on the page.
4. **Were you the mark?** (`/proof`). Paste a trade's signature, or a wallet address. A signature is read off the chain and priced against the real share. A wallet gets every tokenized-stock trade it ever made, priced the same way and totalled, then what it holds now and what selling it all today would cost. Nothing is stored. Public companies are measured against the real share price; private ones (OpenAI, Kalshi, SpaceX) against the token's own price, and the page says which.

A trade placed through the app opens its own proof page when it lands, so the receipt is a link.

## Why it matters
Most dashboards chart the gap between the token and the share. We measured that gap at a median 0.20% on 22 September. What you pay is the fill in the pool, and on the same $25,000 order it ranged from almost nothing to over 2% depending on the stock, moving by the hour. Nothing on a price chart shows it, and no wallet tells you afterwards. THE MARK does both.

## Judging criteria
| criterion | where to look |
|---|---|
| Real user, real problem | `/` scene 4 and `/census`: the whole field, measured live; `/proof` with any wallet |
| Working end-to-end demo | `/check`: quote, block, advice, sign; then `/proof` for the landed trade |
| Belongs on Solana | Jupiter routing, Token-2022 multiplier and transfer fee, issuer powers and trade history read from the chain |
| Quality of execution | Unit-tested cost math; four acceptance scripts in `scripts/`; every page measured at 390px and 1440px |
| Differentiation | It refuses the trade and says what to do instead, before you sign; and it reads what any wallet already paid |

## What is proven, and what is not
- **Tested:** the cost math has unit tests. `scripts/check-v3.mjs`, `check-v31.mjs`, `check-proof.mjs` and `check-v4.mjs` pass against live data.
- **Proven on chain:** `/proof` reconciles real mainnet trades and whole wallets.
- **Not yet proven:** a trade signed through this app. _(to be replaced with its signature)_

## Honesty rules
Every figure comes from a call made for it, or carries its date. The only shared reading is `/census`, cached for two minutes and labelled with its age. A failed read says so and shows nothing in its place. Prices for past trades are read now, not at the moment of the trade, and the page says so. The free Jupiter tier allows one request per second, so under load prices arrive more slowly; they are never filled in.
