# Product Assessment: THE MARK

**Assessment Date:** 2026-09-22  
**Reason:** Founder rejected product five times ("I still don't understand this", "don't see the features", "other sections lack depth", "don't tell me this is the result of the revamp").

---

## (1) Does a stranger understand the product in 10 seconds? What do they conclude?

**YES, barely.** A stranger sees the headline "Buying a stock on Solana? You are probably overpaying, and nothing tells you by how much" and reads the subhead "Say you want $500 of Palantir... THE MARK works out that difference before you buy... and stops the trade if it is bigger than you said you would accept."

**Conclusion:** "This is a price impact calculator and guard for Solana token trades. I enter an amount, it shows me the cost, and it can block bad trades."

**Critical finding:** The charter states the pool is rendered and "the largest, most animated object on the page is the argument against the button." The home fold shows NO POOL. Instead, it shows a static bar chart (kept vs lost). The key visual that makes this product different from every other token calculator is entirely invisible to someone landing on the fold. The pool surface exists in the code (PoolHero component) but is not visible on the screenshot.

**Severity: CRITICAL** — The one thing that could only exist for this product is the one thing not shown on the fold.

---

## (2) Is this ONE product or a calculator plus two appendices?

**ONE product, poorly stitched.** The code and charter confirm three surfaces serving one thesis:

- **Home (/):** Interactive cost calculator + pool surface + price impact guard
- **Census (/census):** Comparative ranking of all tokens at three order sizes, proves the pool variance
- **Proof (/proof):** Transaction verifier + issuer control disclosure, proves accuracy

The logic is solid. But the fold of each surface stands alone. A stranger landing on home doesn't know census and proof exist until after reading three paragraphs. The nav says "INSTRUMENT CENSUS PROOF" in light text, easy to miss. And the visual language differs: home uses bars, census uses a pool surface + bars, proof uses a form + grid. They should share one visual system.

**Severity: HIGH** — The navigation exists but the product feels like three separate tools masquerading as one.

---

## (3) Feature depth: What's missing that a real user would expect?

### Rank by value + buildability in one day (using existing quote/price data):

**CRITICAL (data exists, UI only):**
1. **Price history on /census** — "Show me how INTCx's fill cost has moved over the last 24 hours." Every quote is already timestamped. A one-row chart per token showing the 0.5%, 1.0%, 1.5% range over time would prove volatility and help users time their orders. Cost: one chart library + historical quote fetch on load. **Buildable in 6 hours.**

2. **Order splitting calculator** — "If I broke my $25K order into 5 $5K tranches 10 minutes apart, what would I save?" The Jupiter quote API already returns `routeLegs` and pool liquidity. Computing 2–3 split scenarios and showing the savings ($X cheaper) requires only arithmetic. **Buildable in 4 hours.**

**HIGH (data exists, modest UI):**
3. **Worst-case scenario display** — Show the extreme case: "If the pool drains 20% more before your order lands (due to other trades), you'd pay $X instead." Uses existing liquidity data. **Buildable in 3 hours.**

4. **Token filter/sort on /census** — "Show only tokens under 1% fill cost" or "Sort by volatility." Requires state and a re-sort on load. **Buildable in 2 hours.**

5. **CSV export on /census** — Download the table as CSV. Trivial if the data is already loaded. **Buildable in 1 hour.**

**MEDIUM (non-trivial):**
6. **Price alerts** — "Notify me when INTCx's fill drops below 1%." Requires backend polling and a notification service. Not buildable in a day without infra.

7. **Trade replay on /proof** — "Here are my last 10 signed transactions and what they actually cost." Requires user identity, tx indexing, and a history page. Out of scope for a 72-hour hackathon.

**LOW (data doesn't support):**
8. **Cross-chain comparison** — "What would this cost on Polygon?" Out of scope; THE MARK is Solana-only.

### What best consumer finance products show (Robinhood order preview, Wise fee breakdown, Kayak price history, Google Flights "prices are high"):
- **Proof of rarity:** "This price is 10% above average" (needs historical baseline)
- **Confidence signal:** "Best time to book: now" (needs trend data)
- **Breakdown of every part:** "Exchange rate $X + fee $Y + network $Z = total $W" (THE MARK has this in /proof, not on home)
- **Ability to compare choices:** "If you wait 2 hours, this pool may rebalance and save you $X" (needs prediction)

**Verdict:** THE MARK has the *data* to ship price history, order splitting, and CSV export in a day. It doesn't ship any of them. The founder's complaint "don't see the features" is literal: /census shows one view (three order sizes in bars), no history, no sorting, no export. A user cannot prove the claim ("worst pool charges 52x best") by running their own query.

**Severity: HIGH** — The evidence for the product's main claim is not interactive; it's asserted by the charter and shown in one static screenshot.

---

## (4) Where each surface is shallow, concretely:

### Home fold shallow points:

- **Headline overpromises, fold undershows.** "You are probably overpaying" is the claim. On the fold: 40 lines of explanation instead of a visual proof. The pool surface (which would prove it in one image) is missing. *Line 271–274 of page.tsx: `<PoolHero>` wraps the fold grid, but PoolHero's rendering is not visible on the screenshot; it may be rendered off-screen or have 0 height.*

- **Cost number is abstract.** "$77.49 extra on your $5000, which is 1.55% of what you spend." A stranger doesn't know if 1.55% is good or bad. No context. The census proves "50% of pools are under 0.5%, some are 7.5%"—why not show this range on the home fold too?

- **Stock picker lacks evidence.** Shows "SPYx 0.01%, INTCx 1.55%" but no sources or update time. Are these live? Minutes old? The footer of census says "every figure above came from getQuote against lite-api.jup.ag... at the moment it was read" but the home fold's cost percentages don't say that. *Line 432–467 of page.tsx show costByToken being populated asynchronously, but the UI doesn't disclose staleness.*

- **Guard feature is buried.** "Set the worst fill you will take, then it blocks the bad trade." This is the second-most important feature (after showing the cost). It appears at line 703–750 of page.tsx, far below the fold. A stranger doesn't see it until scrolling past 50% of the page.

### Census fold shallow points:

- **Headline claim unproven on the fold.** "The gap is the same for everyone. the fill is not." Then: "right now the worst pool charges 52x what the best one does on a $25,000 order: tOpenAI at 1.95% against SPYx at 0.00%." But the fold shows only the pool surface and the start of the token list. The ranked table (which proves this) is cut off. A stranger can't verify the claim without scrolling.

- **Pool surface is decorative.** The census shows a green pool surface at the top (matching /). But it doesn't label or explain what it is, or how it relates to the table below. Is it real-time? Static? Why is it there if the table shows the same data? *Code shows it's the same PoolBand component used as visual continuity; it serves no functional purpose on census.*

- **"No read" failures are not explained.** Line 301 of census/page.tsx: "a row that says 'no read' failed its call and shows nothing invented in its place." But a stranger seeing a row with "—" has no idea why. The failure text is not shown; it's just a dash. This violates the charter's ban 1: "no figure on the surface that was not returned by a call made in that moment... shows nothing invented in its place."

- **Order sizes are not comparable.** Showing three bars per token (for $500, $5K, $25K) is good, but there's no way to see "across all tokens at $5K, which is best?" or "for token X, does the fill get better or worse at higher order sizes?" A user cannot slice the data.

### Proof fold shallow points:

- **Why verify?** The headline says "this receipt came off the chain, not off this page," but doesn't answer "why should I care?" A user might think: "OK, but I was there when I signed it, so I know it's real." The fold doesn't explain the value (detecting front-running, slippage overages, or issuer interference). The fold should say: "Check whether what you were promised on this page is what actually settled on-chain."

- **"Receipt code" is unexplained.** Placeholder says "paste a receipt code from any Solana trade." What's a receipt code? Is it the transaction hash? The user expects to know. *The code shows it's `signature` (the tx hash), but the UI doesn't define it.*

- **Example button is vague.** "Check a real trade" — check for what? Correctness? Fraud? The button text doesn't hint at the benefit. Compare to Wise: "See how much you'll actually get" makes the action and benefit clear.

- **Hidden charges section is huge but below fold.** The section "Two things quietly change what a token is worth" (multiplier + transfer fee) is THE main finding of /proof (that issuer controls and token math affect cost). This belongs on the fold, not below it. The headline should say something like "Found $47 in hidden issuer charges you wouldn't see anywhere else" (with the number live).

**Severity: HIGH** — Every fold prioritizes explanation over evidence. A stranger sees copy instead of data.

---

## (5) Single biggest product-level change to stop rejection:

**Move the WebGL pool surface to the home fold and make it the PRIMARY visual, with controls and output overlaid on it.**

Currently:
- Pool surface is invisible or hidden on the fold
- Cost is a static number in red text
- Guard is a text input below the fold
- User cannot see what they're buying into

Should be:
- Pool surface dominates (50% of the fold area at 1280px)
- Amount slider on top of / beside the pool
- **As user types the amount, the pool drains in real-time in the WebGL view**
- **Cost meter counts up as the trench deepens**
- **Guard line (user's limit) is painted on the pool surface, red for "over limit," green for "safe"**
- Sign/refuse button is overlaid at the bottom: if trench crosses the line, button becomes a refusal badge

Why this works:
1. **Answers "what is this?" instantly.** No words needed. You see a lit pool, you drag an amount, you see the cost open up in the surface.
2. **Matches the charter's thesis.** "The trench is the bite your order takes." The pool is not a label; it's the subject.
3. **Fixes the founder's main complaint.** "I still don't understand" becomes "oh, I'm draining this pool and the cost is the depth of my trench."
4. **Uses data already live.** Every quote returns `liquidityUsd` and `fillCostPct`. The pool is not invented; it's the x*y=k curve from the route.
5. **Makes the fold memorable.** A 3D lit pool reacting to input is the only competitive advantage this product has vs. terminal-style fee charts. Show it.

Cost to implement: Move PoolHero rendering into the fold visible area (likely already rendered, just needs a CSS fix), and re-layout the input controls to the left or overlay them. **Buildable in 4 hours.**

**Severity: CRITICAL** — The product IS the pool. Show it or users can't see what you built.

---

## (6) One-sentence verdict:

THE MARK has a genuinely useful product (live price impact guard for Solana tokens with on-chain verification), excellent engineering, and clear design direction (pool-centric, density over clutter), but the fold reveals almost none of this—it shows walls of copy and a bar chart when it should show a lit pool draining in real time, making the cost and the claim visible in 3 seconds.

---

## Summary severity tally:

| Finding | Severity | Evidence |
|---------|----------|----------|
| Pool surface missing from home fold | CRITICAL | CONTEXT.md line 5, charter lines 69–72, screenshot shows PoolHero not visible; page.tsx line 271 wraps fold but no render |
| Feature depth: no price history, order splitting, sorting, or export | HIGH | Comparison to Robinhood/Wise/Kayak; census shows static ranked table only; code has data (quote timestamps, routeLegs, liquidity) but UI doesn't expose it |
| Three surfaces feel disconnected, not one product | HIGH | Nav says "INSTRUMENT CENSUS PROOF" in light text; each fold stands alone; visual language differs (bars, pool surface, form) |
| Census headline claim unproven on fold | HIGH | "52x spread" stated but ranked table is cut off; stranger can't verify |
| Proof fold has no "why verify?" answer | HIGH | Headline states "came off chain" but doesn't explain the value (fraud detection, slippage audit) |
| Home headline overpromises ("you overpay"), fold underdelivers (shows copy, not proof) | HIGH | Charter: "pool is subject"; screenshot shows no pool |

