# Paste-ready text for the Stocklana submit form

**Project name:** THE MARK

**Tagline (one line):** What a tokenized stock really costs you before you buy it on Solana, and a stop on the trade if that cost is more than you allow.

**Links**
- Live: https://themark-nine.vercel.app
- Repository: https://github.com/hemjay07/themark
- Video: https://youtu.be/5kyckiNkx-k

**Track:** Main Track
**Bounty:** Tessera, Best Use of Tessera. (Not PreStocks: its rules exclude projects that integrate other pre-IPO tokens, and this one does.)

**Description**

Tokenized stocks on Solana trade in pools that are thin at the wrong hours. A price chart shows the token's price; it does not show what your order costs to fill: the price moving against you in the pool, plus the transfer fee some tokens charge on every move. We measured the gap between token and share at a median 0.20% across 20 pairs on 22 September, while a $25,000 order cost between 0.06% and 2.56% to fill depending on the stock. The fill is where the money goes.

THE MARK prices your exact order in the exact pool it will fill in, from a live Jupiter quote plus what the token's own Token-2022 mint says, and stamps it BLOCKED if the extra is over the limit you set. Blocked orders never reach your wallet. One click cuts the order to the largest size that fits (checked with two fresh quotes), or the ticket watches the line and re-quotes every 30 seconds until it clears. Under the limit, Phantom signs it and the app opens the trade's own receipt when it lands.

Three pages. Check: the ticket is the app. Compare: every stock at $500, $5,000 and $25,000 against the limit you set. Verify: paste any trade signature or wallet address, and every tokenized-stock trade it made is read off the chain, priced against the real share (or the token's own price for private companies, and the page says which), totalled, and stamped against a 1% line, with what the wallet holds now and the toll for selling it all today.

No sample data and no placeholder price. When a read fails the page says so. Every figure is a live call or carries its date.

Proven on mainnet: a $10 order of S&P 500 placed through the app on 25 September 2026, signed in Phantom, receipt at https://themark-nine.vercel.app/proof?sig=4aGuaMziy4PL9A8Tvfysyy7eGSmdksSzSSy1U6EUzQKQifSE5mMmsaRu1nnuBpAoNgJSEEbAhjqcowtULRKxn8b

**Tessera bounty note**

THE MARK reads Tessera's OpenAI, Kalshi and SpaceX tokens the same way it reads every other stock: the live fill cost of an order in their pools, the 0.20% transfer fee from the mint's own config, the issuer's powers over the token, and any wallet's trades in them priced against the token's own price (the page says there is no public share price to hold a private company to). On 25 September a $25,000 order of OpenAI cost about 1.6% to fill while $5,000 cost about 0.6%; the app shows that difference before anyone signs, and cuts the order to the size that fits.

**Tech**

Next.js 14, TypeScript. Jupiter quote, price and swap APIs through a server-side paced queue (free tier, one request per second). Solana JSON-RPC for mint extensions and transaction history, with endpoint rotation. Token-2022 transfer fee and scaled-balance multiplier read from the mint. Phantom for signing. Jest for the cost math; five Playwright acceptance scripts against live data. Hosted on Vercel.
