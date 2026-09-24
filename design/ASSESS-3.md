# ASSESS-3 — after PRD-V3 (2026-09-23)

Three independent lenses on design/shots/assess3/ (14 loaded screenshots, 1440 and 390): craft and
brand (render-judge, pixels only), product and UX (drove the app in a browser), hackathon judge.
Reports: design/assess3/craft.md, product.md, judge.md. Plus my own read of the same shots.

## Scores and standing
Judge: 82/100 (was 79). Craft: "competent floor-tier entry, not a winning one", below tare.
Product: "shows what it does in ten seconds". The product lens was the weakest pass: two of its
findings were wrong (no-route handling was verified in a browser on 2026-09-23; the issuer read has a
failure message), and it missed the loading chips and the colliding labels. Weighted down.

## Coverage matrix
| finding | craft | judge | product | me | confidence |
|---|---|---|---|---|---|
| Blocked state is below the fold on a phone | high | yes | - | yes | high, 3 |
| The saving is set far smaller than the loss; advice has no button | high | yes | - | - | high, 2 |
| Compare stocks opens with every row empty | critical | yes | - | (cause: reading cleared on restart) | high, 2+ |
| First screen opens on a harmless number ($4.08, "fine") | critical | - | - | yes, default advice is thin | 2 |
| 390: "EXTRA THIS ORDER COSTSYOUR LIMIT" labels collide | high | - | - | yes | 2 |
| Stock chips show "…" for 15s+ | high | - | misread | yes | 2 |
| No signature object or motion; styled default, not a brand | high | "functional not distinctive" | - | - | 2 |
| Name's second meaning ("the mark") unused | high | - | - | - | 1, but the founder's own rule 14 |
| Census 3D strip unreadable; PRD-V3 R6 said remove it and it was not removed | critical | - | - | yes, missed in build | 2 |
| Census footnote shows an API URL (and is out of date) | med | - | - | yes | 2 |
| Proof example is a benign trade ($0.16 in the user's favour) | med | - | - | - | 1 |
| Unshipped: no URL, video, repo, signed trade | - | critical | - | known | ledger T006-T008 |

## Contradiction resolved
PRD-V3 check 2 wanted the default order to PASS so the button shows. Craft and judge both say the
strongest thing is the block plus the advice, and the first screen should open on a loss. Both are
satisfied by: open on a painful order (blocked, advice visible), and give the best advice a button
("Use $X") that sets the amount, turns it green and brings the Place Order button back. One click
from landing to a placeable order. PRD-V3 check 2 is amended to that.

## What all three missed
- The census reading lives in Next's data cache, which is emptied by every build and deploy. On
  Vercel the first visitor after each deploy waits ~25s. Needs a warm-up after deploy and an honest
  first-reading state instead of 24 empty bars.
- Advice ran while the chip scan and the main quote shared a 1 request/s key; the "checking" string
  can sit for 10s+. Nobody measured time-to-advice.

## Verdict
Clear, honest, and differentiated, but it opens on the least persuasive state, its best feature is
under the fold on a phone and has no button, one page opens empty, and nothing about it is memorable.

## Improvement plan (V3.1), each a ledger task closed by scripts/check-v31.mjs
1. Open on a painful order; the best advice gets a "Use $X" button that makes the order placeable.
2. Phone order: sentence, number, line, block + advice, then controls. Savings shown at weight.
3. Labels under the line never collide (stack at narrow widths).
4. Headline uses the name: "Don't be the mark." with the sentence beneath. A "BLOCKED" seal stamps
   onto the limit line when the bar crosses it. Lockup mark drawn larger.
5. Census: remove the 3D strip; while the first reading is being taken, say so with progress instead
   of 24 empty rows; plain footnote.
6. Chips show a loading bar, not "…".
7. Proof: an example trade that actually overpaid, if one can be found on mainnet.
