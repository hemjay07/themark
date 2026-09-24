# THE MARK: Stocklana submission

**One line.** THE MARK shows what a tokenized stock really costs you before you buy it on Solana, and stops the trade if that cost is more than you allow.

## Links
- Live demo: _(pending deploy)_
- Repository: _(pending publish)_
- Demo video: _(pending)_

## What it does
1. **Check an order** (`/`). Pick a stock, an amount and a limit. You see the extra cost of that exact order in dollars, from a live Jupiter quote plus any Token-2022 transfer fee. Over your limit, the order is blocked, and the page tells you what to do instead:
   - buy less, with a one-click amount that passed two fresh quotes;
   - split the order into three;
   - what the same money costs in another stock.

   It also lists what the issuer can do to your tokens (take them, pause trading, run code on every transfer), read from the mint itself.
2. **Compare stocks** (`/census`). Every stock at $500, $5,000 and $25,000, read live and refreshed every two minutes. On 24 September, $25,000 of OpenAI cost about 2.3% extra, and the same order in the S&P 500 cost almost nothing.
3. **Verify a trade** (`/proof`). Paste any trade signature. It reads what actually moved off the chain and prices it against the real share. The example is a real $150.93 OpenAI purchase from 24 September that paid $2.82 more than the shares were worth.

When a trade placed through the app lands, the app opens that trade's proof page, so the receipt is a link you can keep.

## Why it matters
Most dashboards chart the gap between the token and the share. We measured that gap at a median 0.20% on 22 September. The cost that decides what you pay is the fill in the pool. On the same $25,000 order, that ranged from almost nothing to over 2% depending on the stock, and it moves by the hour.

## Judging criteria
| criterion | where to look |
|---|---|
| Real user, real problem | `/census`: the whole field, measured live |
| Working end-to-end demo | `/`: quote, block, advice, sign; then `/proof` for the landed trade |
| Belongs on Solana | Jupiter routing, Token-2022 multiplier and transfer fee, issuer powers read from the mint account |
| Quality of execution | Unit-tested cost math; acceptance scripts in `scripts/`; every page measured at 390px and 1440px |
| Differentiation | It refuses the trade, and says what to do instead, before you sign |

## What is proven, and what is not
- **Tested:** the cost math has unit tests. The acceptance scripts (`scripts/check-v3.mjs`, `check-v31.mjs`, `check-proof.mjs`) pass against live data.
- **Proven on chain:** `/proof` reconciles real mainnet trades.
- **Not yet proven:** a trade signed through this app. _(to be replaced with its signature)_

## Honesty rules
Every figure comes from a call made for it. The only shared reading is `/census`, which is cached for two minutes and shows its age on the page. When a call fails the page says so and shows nothing in its place. The free Jupiter tier allows one request per second, so under load prices arrive more slowly; they are never filled in.
