# PRD v3 — from a calculator that says no to a guard that tells you what to do

Date: 2026-09-23. Owner: founder. Source: the self-assessment of 2026-09-23 06:59 (four founder
screenshots of localhost:3000), which answered "is this the best frontend we can do" with no.

## Problem, in one paragraph
A stranger lands on a big red number with no sentence saying what the product is. At the default
settings the order is blocked, so the Place Order button never appears and nobody sees that the
product can trade. When it blocks it only says no; it never says what to do instead. The strongest
finding (the same $5,000 costs nothing in one stock and ~$67 in another) sits in 10px text. Stocks
are shown as tickers, the limit line is unlabelled, the routing box is noise to a non-finance
reader, the issuer powers are at the bottom in jargon, the nav uses internal names, the layout is
one narrow column on a wide screen, and the background grid reads as texture.

## Who it is for
Someone about to buy a tokenized stock on Solana who is not a finance person. Secondary: a
hackathon judge with four minutes.

## Success, stated as checks (each is a command; see "Acceptance")
1. The first screen at 1440 and at 390 contains one sentence saying what THE MARK is.
2. The default order passes the limit, so the action button is visible on first load.
3. Dragging the amount to $25,000 on the default stock shows the Blocked state.
4. When blocked, a "what you can do instead" panel shows at least one option with a dollar figure
   that came from a live quote.
5. No ticker is the primary label anywhere a person reads it: company names, ticker small.
6. The limit line has labels for what the bar is and where the limit is.
7. The issuer powers appear above the kept-versus-lost section, in plain words.
8. Nav reads "Check an order / Compare stocks / Verify a trade".
9. The routing box is one sentence of exchange names, no percentages.
10. At >= 1100px the page is two columns; at 390 it is one; nothing clipped, no horizontal scroll.
11. The meaningless background grid is gone.
12. Ruler (measure.mjs --motion --floor) returns findings [] for /, /census, /proof at 390 and 1440.
13. Founder writes APPROVED lines. Nothing here is "done" before that.

## Scope

### R1. Say what this is
One sentence above the number, 18-20px: "THE MARK shows what a tokenized stock really costs you
before you buy it on Solana, and stops the trade if that cost is more than you allow."

### R2. What to do instead (the new feature)
A panel directly under the limit line. Title: "What you can do instead" when blocked, "Ways to
pay less" when not. Up to three options, each a sentence with a live dollar figure:
- **Split the order.** One extra quote at amount / 3. Total = 3 x that order's cost. Show only if
  it saves at least $0.50. Wording states the assumption: "three orders of $1,667, a few minutes
  apart so the pool can refill: about $X in total, $Y less." ("about" because refill is assumed.)
- **Buy less.** Only when blocked. Estimate the largest amount under the limit from the live
  impact (impact is roughly proportional to size), round down to $50, then CHECK that amount with a
  live quote. Show it only if the check passes: "Up to $A of Intel stays under your 1.00% limit
  (checked just now: $c extra)." If the first estimate fails its check, try 70% of it once.
- **For comparison.** From the selector's live per-stock costs: the cheapest other stock at the same
  amount: "The same $2,000 in the S&P 500 costs $0.20." A comparison, not investment advice.
Data: getQuote through /api/jup (high priority), passing the main quote's mint extensions so each
option costs one quote plus one price read. Debounced 600ms after the main quote lands. Every
figure is a live call; nothing is remembered.

### R3. Names, a labelled line, a default that passes
- tokens.ts gains displayName: SPYx S&P 500, AAPLx Apple, TSLAx Tesla, INTCx Intel, PLTRx Palantir,
  tOpenAI OpenAI, tKalshi Kalshi, tSpaceX SpaceX. Used in the selector, hero, advice, census rows,
  proof rows. Ticker appears small beneath the name.
- Limit line legend: "extra this order costs" on the bar colour, "your limit 1.00%" at the red mark.
  The "you keep 99%" label goes (kept-versus-lost says it properly below).
- Default: Intel, $2,000, limit 1.00%. Under the slider: "drag it up to see where this order gets
  blocked". The default is chosen so the button shows; the cost itself is live.

### R4. Issuer powers up, in plain words
Directly under R2, titled "Before you buy Intel": one plain sentence per power that exists on the
selected token. A failed read says the read failed, never "no risks".

### R5. Names people understand
Nav: Check an order (/), Compare stocks (/census), Verify a trade (/proof). Page kickers match.
"More surfaces" becomes "Also in THE MARK". Routing: one line, deduplicated exchange names, e.g.
"Your order fills through Raydium and Kipseli." No percentages.

### R6. Layout and the background
>= 1100px: two columns. Left: sentence, number, limit line, R2, R4. Right: a sticky card with the
controls (stock, amount, limit) and the action button, so you drag on the right and watch the left.
< 1100px: one column in the order sentence, number, line, controls, button, R2, R4.
Below both: kept-versus-lost, pool share, routing line, "Also in THE MARK".
The full-page WebGL grid behind the fold is removed: three assessments and the founder read it as
texture, and it cost frame budget. The pool-share bar stays as the readable picture of "how much of
the supply you eat". The census band goes too, for consistency. Charter depth_level is noted as
changed by this decision.

## Out of scope
Deploy, the real trade and the video (separate ledger tasks). Any change to the cost math.

## Risks
- Rate budget: R2 adds two quotes per amount change on a 1 req/s key. Mitigated by debounce and
  by running after the main quote; the main number never waits for advice.
- "Split" saving depends on the pool refilling between orders; the copy says so.
- Removing the WebGL surface lowers visual ambition; the founder has previously asked for more
  ambition, so this is flagged in the report rather than hidden.

## Acceptance
scripts/check-v3.mjs drives a real browser at 1440 and 390 against a running server and exits 0
only if checks 1-11 hold. The Ruler covers 12. Check 13 is the founder.

### R2b. No route is a finding, not a blank (added after the first acceptance run)
Jupiter answers "No routes found" for some stock and size pairs (Intel at $25,000 on 2026-09-22 and
again in the first check-v3 run). Today the product then shows nothing. Instead: block the order and
say "No exchange on Solana can fill $25,000 of Intel right now", then offer Buy less (R2) at the
largest size that does route.

### Default stock (revised 2026-09-23 ~08:30 UTC)
Intel's pool thinned during the morning: its impact rose to ~2.07% even at $1,000, so an Intel
default blocked on arrival. Measured at the time: S&P 500 0.01% / 0.03%, Apple 0.04% / 0.23%,
Tesla 0.04% / 0.07%, Palantir 0.54% / 1.48% at $2,000 / $25,000. Palantir is the one that passes a
1% limit at $2,000 and blocks at $25,000, so it is the default. This is a live market: the default
can drift, and PRD checks 2 and 3 depend on it.

### Check 8 amended (2026-09-23)
At 390px "Check an order / Compare stocks / Verify a trade" ran off the screen (Ruler: right edge 543px).
Nav now reads the full names at > 640px and "Check / Compare / Verify" at <= 640px. Check 8 tests the
full names at 1440 and the short ones at 390.

### Check 2 amended by ASSESS-3 (2026-09-23)
The page now opens on a painful order (blocked, advice visible), because the block plus the advice is
the strongest thing the product does. Check 2 becomes: on load, either the action button is visible,
or the advice offers a "Use $X" button that makes the order placeable in one click (tested by
scripts/check-v31.mjs #1b).

### Default limit (revised 2026-09-24)
Palantir at $25,000 fell under 1% during the night, so the page stopped opening blocked. The default
limit is now 0.50%, Jupiter's own standard slippage setting, which keeps the painful opening order
far more often. It is a live market: no default is guaranteed, and checks that depend on it can drift.

### Default limit (revised again 2026-09-24, later)
Back to 1%. At 0.5% Palantir had no passing size at all (the cost floored near 0.58% even at $1,750), so the page opened on a block with no way out. At 1%: $25,000 costs 1.26% (blocked) and $8,900 costs 0.79% (passes). Buy-less now steps down from an estimate and only suggests a size that passes two separate quotes under 90% of the line, because cost is not monotonic in size ($2,000 measured 1.22% while $5,000 measured 0.59%). When nothing fits it says so with the smallest size checked.

### Default stock (revised 2026-09-24, later)
OpenAI replaces Palantir. Palantir at $25,000 read 0.54%, 1.26% and 0.83% within two hours, so it opened blocked or not by chance. OpenAI read 1.93%, 2.14% and 2.14% today and rises smoothly with size (0.42% at $500, 0.95% at $2,000, 2.14% at $25,000), so a 1% limit blocks the default and a smaller size passes.
