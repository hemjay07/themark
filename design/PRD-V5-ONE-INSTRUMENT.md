# PRD V5: one product, three instruments (2026-09-25)

## Why
The founder, on V4: "I wanted a revamp, a rethink of all the features and pages, then a rethink of the entire frontend"; "Launch app is the same as Check an order; so many things on the app don't make sense." He is right. V3 and V4 were layered: a story page on top of a tool page on top of a form, and the duplicates show (two nav items for one page; the cost printed three times; the app re-explaining what the story just said; navigation as content at the foot of every page).

## The product, said once
One user, three moments: before an order, across the field, after a trade. Each moment is one instrument, and every instrument is built from the same objects: paper, the line, the stamp, the tear.

## The pages
- **`/`, the story.** Sells the three instruments. Its nav: How it works, The field, Were you the mark, Answers, and the Launch app tag. It never lists "Check an order".
- **`/check`, Check.** The ticket is the app. Everything the reader sets is on the ticket: the stock as a row of stubs across its top (each with its live cost), the amount on its amount line with the slider under it, the limit typed into the line's own label. Then what the order costs, the line, the stamp. Then the issuer's lines. Then the foot: blocked, "Not placed, over your line," with **Cut to $X** and **Watch the line**; clears, "Within your line," with **Place this order**. The other two ways out (split, a cheaper stock) hang off the ticket as torn stubs with their live figures. No headline, no steps, no cards, no "also in THE MARK".
- **`/census`, Compare.** The field against your line: a limit slider at the top, every stock at $500, $5,000 and $25,000 as bars drawn against the line at that limit, red over it, green under. The line moves as the slider moves. A sentence above it states the result in words ("At 1%, the S&P 500 clears at every size; OpenAI clears only under $500."). The reading's age stays on the page.
- **`/proof`, Verify.** One box takes a trade's receipt code or a wallet address. A wallet prints as a ledger on paper: the total paid over, the holdings and the toll, every trade. A trade prints as a receipt on paper. The empty state offers a real trade, a real wallet, and the reader's own.

## Navigation
Two navs, chosen by path. Story: section anchors and the Launch app tag. App pages: Check, Compare, Verify, and the wallet button (short labels on a phone).

## Motion
The devices from design/CREATIVE.md: the cut, watch the line, the tape, the stubs, the tag, the ink, the line through the field. Movement and clip only; text never starts invisible.

## Acceptance
`scripts/check-v5.mjs` at 1440 and 390:
1. `/check` has one ticket (`[data-ticket]`) that contains the stock stubs, the amount input, the limit input, the cost figure, the line, the stamp and the foot; no `h1` on the page.
2. On load the ticket is stamped BLOCKED and the foot carries a `[data-use-amount]` button whose text begins "Cut to $"; clicking it makes the ticket CLEARS and shows the place-order button.
3. The two secondary stubs (`[data-stub]`) show a live dollar figure once loaded.
4. The app nav shows Check, Compare and Verify; the story nav shows "Launch app" and no "Check an order".
5. `/census` has a limit slider and 24 bar cells (or the first-reading state); moving the slider changes which bars are red.
6. `/proof` scans the demo wallet to a ledger with a total and at least one holding row.
7. No horizontal scroll on any page.

## Amendments to earlier checks (recorded, not hidden)
- check-v3 #10 (two columns, controls right of the hero) and check-v31 #2 (phone order controls, action, advice) described the V3 layout, which V5 replaces with one ticket. Both are retired; check-v5 #1 and #2 carry their intent (the controls and the outcome are one object, and the way out is one click).
- check-v3 #1 (the one-sentence description) moves to the story page, where the sentence lives now; check-v5 #4 checks the app's nav.
- check-v31 #1 expected "Use $": the verb is now "Cut to $", the product's device. check-v5 #2 tests it.
- check-v3 checks 5, 6, 7, 9, 11 and check-v31 #3, #4, #6 hold on `/check` unchanged, and check-v3/check-v31 keep running against it for those; the retired checks are removed from those scripts with this note in each.

- check-v4 #7 expected the app's nav names on the story; the story now has its own nav (How it works, The field, Were you the mark, Answers). The check reads those instead.
- check-proof.mjs clicked "Check a real trade"; the button now says "Try a real trade" (the first-use walkthrough found the three example buttons read alike). The script clicks the new label.
- Scene 4 of the story is now a pinned horizontal strip of paper stubs (one per stock, stamped on $25,000), which slides as the reader scrolls; on a phone it scrolls sideways. check-v4 #4 counts the stubs instead of bars. The bars against the line live on /census.
- check-proof.mjs clicked an example button; the example receipt now prints on load (the pixel judge's finding that Verify's empty state was a bare form), so the script waits for the receipt itself.
