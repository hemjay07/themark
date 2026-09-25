# PRD V4: THE MARK as a directed experience (2026-09-24)

## Why
Partner feedback on V3.x, which was a single tool page: the UI "can be way better", "people won't know how to use it", and the end goal is hard to find. The founder's reference is chit.tools. It is a deck of full-screen scenes that snap one at a time. Each scene makes one statement with one live device. The app is its own page, and "Launch app" is always one click away. The founder also said: never remove what was genuinely good. So the trade ticket, the BLOCKED and CLEARS stamps, the advice, the issuer powers, the proof page and the census all carry over.

## What the reference does (studied 2026-09-24, frames in the scratchpad)
- `main.stage` scrolls with `scroll-snap-type: y mandatory`. Nine sections: top, how, boundary, line, limits, bot, burn, build, faq.
- Reveals are triggered by IntersectionObserver and cut with clip-path. No GSAP, no WebGL. The quality comes from precision, not from libraries.
- Every scene has a huge statement or numeral (24, 1, 1.01%, 96%) and a small live device: wallets with funding lines, a phone running the bot, a grid of burned squares.
- Progress dots on the right. A pill nav with "Launch app". The last scene is "Launch the app."

## Structure
- `/` becomes the story: nine snapping scenes.
- `/check` becomes the tool: the V3 ticket page, unchanged in behaviour. The nav's "Launch app" pill and every scene's call to action go there.
- `/census` and `/proof` stay, and get the same nav.

## The nine scenes (one statement each; every number live, or labelled with its date)
1. **Don't be the mark.** A trade ticket prints in and BLOCKED slams across it. Left: the headline and one line: "See what a tokenized stock really costs before you buy it on Solana. Over your limit, THE MARK stops the trade." Buttons: Launch app, and "See how it works". Corner tape: the live spread from the census ("OpenAI costs N× what the S&P 500 does on $25,000, right now").
2. **The price isn't the cost.** Two numerals side by side: "0.20%", the median gap between token and share that everyone charts, against the live worst fill at $25,000 from the census. A bar pair shows the gap.
3. **Three moves.** 01 Pick a stock. 02 Set how much and your limit. 03 Placed, or blocked. Each card has a small live chip.
4. **The same order, eight prices.** The census at $25,000 as eight bars that grow in when the scene enters, worst first. Link: Compare stocks.
5. **Stamped before you sign.** A live mini-ticket that cycles through three stocks, taking each one's cost from the census, and stamps BLOCKED or CLEARS against a 1% line.
6. **What to do instead.** Three stubs slide in: buy less, split in three, a cheaper stock. They show the real figures from the census.
7. **What the issuer can do.** A huge numeral: the count of the eight tokens whose issuer can take tokens from your wallet, read live from the mints. Power rows as in /proof.
8. **Read it off the chain.** The real OpenAI purchase that overpaid, shown as a receipt, with a link to /proof.
9. **Straight answers, then Launch the app.** An accordion FAQ: is this financial advice, does it hold my funds, where do the numbers come from, why was my trade blocked. Then the closing call to action.

## Motion rules
- Scenes snap. Each scene's device animates when it enters (IntersectionObserver), once, with transform and opacity only. No blend modes and no background-position animation (both measured as frame drops on 2026-09-24).
- The page must read in full with reduced motion: every element keeps its final state when animation is off.
- Phone: scenes stack and snap. Devices shrink rather than disappear.

## Acceptance (done_when)
- `scripts/check-v4.mjs` must exit 0 at 1440 and 390:
  - `/` has 9 `[data-scene]` elements;
  - each scene's statement is visible;
  - a "Launch app" link to /check is in the nav and in the last scene;
  - scene 4 shows 8 live values, or its "taking the first reading" state;
  - scene 7 shows a live count;
  - no horizontal scroll.
- `check-v3`, `check-v31` and `check-proof` pass against `/check`. Their base path is amended and recorded below.
- The Ruler is clean on `/`, `/check`, `/census` and `/proof` at both widths. Every screenshot is read.

## Amendment: acceptance scripts
check-v3 and check-v31 tested the tool at `/`. The tool is now `/check`, so they take the page path as a second argument, which defaults to `/check`. Their assertions are unchanged.

## Amendments (2026-09-25)
- Scene 8 is now "Were you the mark?": a wallet scan (any address, or the connected wallet) beside the live example receipt. The scan lives on /proof (`?q=` takes a signature or an address) and reads through `/api/wallet`.
- Reference prices: a public company's token is measured against the real share price; a private company's (Tessera's t-tokens) against the token's own market price, because its "stock price" is a valuation mark the token trades far from (Kalshi: token $446, mark $882 on 2026-09-24). `referencePriceFor` in src/lib/tokens.ts; every surface says which it used.
- RPC: the default endpoint allows about ten `getTransaction` calls per ten seconds, which made a scan take a minute. src/lib/solanaRpc.ts now starts each method on the endpoint that serves it (publicnode for transaction and account reads, mainnet-beta for address history) and rotates on any refusal. A scan of a busy wallet takes about 8 s.
- Entrances are movement only. Text never starts at opacity 0 (Ruler rule 4), so the page reads in full in any capture and with reduced motion.
- Evidence: check-v31, check-v3, check-proof and check-v4 pass at 1440 and 390; the Ruler is clean on /, /check, /census and /proof at both widths; jest 22/22.
