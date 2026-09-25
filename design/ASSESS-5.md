# ASSESS-5 (2026-09-24 late, on the trade-ticket home; acted on 2026-09-25)

Question from the founder: "are you sure this is the best UI?" Three independent lenses (a pixel judge on the screenshots, a first-use UX walk-through, a hackathon judge), each told to cite only what it could see or read.

## Agreed (2 or 3 of 3)
| finding | outcome |
|---|---|
| A blocked order ends with no button on the first screen | fixed: the best size ("Use $X instead") sits in step 4, beside the controls |
| On a phone the controls came last, after the result | fixed: phone order is controls, step 4, then the alternatives (check-v31 #2 amended, PRD-V3) |
| The end goal (a signed order) is not visible | fixed: "Connect wallet" in the top bar on the app, "Launch app" elsewhere |
| The inputs are unlabelled: chip percentages, a bare "25000", a bare "1" | fixed: a line saying what the % is, a $ on the amount, a % on the limit, a plain hint under it |
| The pass state left a blank where the stamp sits | fixed: a green CLEARS stamp |
| Serviceable, not memorable; nothing moves; "a well-built calculator" | the reason for V4 (design/PRD-V4-LANDING.md): the story at /, the tool at /check |

## Overruled
- Rewriting the one-line description: it is the approved line, and check-v3 #1 holds it.
- Opening on a smaller, unblocked order: the block is what the demo is for.
- Emoji indicators and swapping the two columns: not in this product's voice.

## Claims checked and not acted on
- "The limit label sits left of its tick" (pixel judge): the screenshot shows it centred on the tick.
- "No loading state for quotes" (designer): the ticket shows a shimmer, then the figure.

## What followed
The founder's bar moved to chit.tools-level craft plus backend features with instant value. V4 answers both: nine snapping scenes, and "Were you the mark?", a wallet scan that reads every tokenized-stock trade off the chain (src/app/api/wallet/route.ts). Evidence for V4 is in PROGRESS.md and scripts/check-v4.mjs.
