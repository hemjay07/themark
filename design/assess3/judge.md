# HACKATHON JUDGE ASSESSMENT: THE MARK (Rebuilt)

**Project:** THE MARK | **Hackathon:** Stocklana (Solana Foundation) | **Assessment Date:** 2026-09-23  
**Assessor:** Independent Judge | **Prior Scores:** 72, then 79 (pre-rebuild) | **Current Submission:** Rebuilt product per PRD-V3

---

## 1. SCORE: 82/100 (Rebuilt product as shown in assess3/ screenshots)

### Breakdown by Official Judging Criteria

| Criterion | Score | Evidence | Gap |
|---|---|---|---|
| **Real User, Real Problem** | 19/20 | 801,439 tokenized-stock holders (Solana Compass, 12 Sep 2026); $4.9B H1 volume; 63% after-hours trading when books are thinnest; measured fill costs 0.06%–2.56% (40x spread) on a $25,000 order, same pool, same minute (2026-09-22); named, dated complaints (@RStudios64042, @gupta_kanv, @DYORTerminal); median token-vs-share gap 0.20% across 20 pairs measured by the builder. Problem is real, numbered, and verifiable. | *Minor:* Proof of a transaction signed by this app not yet demonstrated on mainnet. |
| **Working End-to-End Demo** | 12/20 | Screenshots show complete flow: stock selector → live quote → cost as dollar and % → limit slider that blocks the order → refusal with "what to do instead" advice → /census comparing all stocks → /proof reconciling a landed transaction. Three surfaces fully responsive at 390px and 1440px. No animations, no micro-interactions. | *Critical:* Live URL not deployed; app runs only on localhost. GitHub not published; code cannot be independently audited. No demo video submitted. A judge can *see* the design, not *use* the product. The signing path remains unproven end-to-end (Phantom wallet integration code-reviewed but not exercised). |
| **Belongs on Solana** | 18/20 | Cost is a property of the pool you quote at quote-time (on-chain); Token-2022 mint extensions (scaledUiAmountConfig for xStocks, transferFeeConfig for t-tokens) are read off the mint account at quote time and factored into cost math; refusal and receipt are the same transaction; /proof decodes mainnet transactions and reads live extension state for every mint touched. Rebuild adds "Before you buy [stock]" plain-language issuer powers (ability to drain wallet, rebasing, etc.). Technically sound. | *Minor:* Tessera t-token support designed but not live-tested. Only 8 of 8 xStocks + 3 t-tokens implemented; thinner than "all tokenized stocks on Solana" but sufficient for first phase. |
| **Quality of Execution** | 16/20 | Stack: Next.js 14 (app router), TypeScript, hand-written WebGL2 (no Three.js), Jupiter lite-api integration, unit-tested cost math. Responsive design measured at both widths. Rebuild adds: one-sentence headline stating value prop, default stock/amount that passes the limit (so action button visible on load), blocked-state advice panel with live dollar figures ("Split into 3 orders at $X"), comparison option with live quotes, plain-language issuer powers. No cached data; all figures live at request time. Code discipline is high (three explicit bans enforced). | *Moderate:* UI is clean and readable but not distinctive. Dark theme with red/green is crypto-dashboard default. No animations, motion, or micro-interactions. The strongest finding (fill costs vary 40x) sits embedded in /census as a detail, not featured above the fold on /. Logo is a small red glyph that cannot be read at 20px. Lacks visual memorability. |
| **Differentiation** | 17/20 | The field (14 named public dashboards) all chart the token-vs-share gap (0.20%, median; not worth drawing per the builder). THE MARK alone: (a) shows the *fill cost before you sign* (not after, not hypothetical), (b) blocks the order if cost exceeds your limit (guards the click), (c) offers *live alternatives* with quotes when blocked ("split the order, buy less, compare pools"), (d) provides *proof* by decoding the landed transaction and reconciling it against what the screen promised. No competitor combines all four. fairfill (price router) exists but serves a different user (arbitrage, not refusal). Strongest differentiation is the honest answer: "This pool will take 2.56% of your order; do you want to continue?" | *Minor:* The blocked state and alternatives are not immediately obvious without scrolling on mobile. The moral case ("don't be the mark") is stated in README and social card but not prominently featured in the product itself. |

**Subtotal: 82/100**

---

## 2. WHAT A JUDGE CONCLUDES IN 20 SECONDS (Desktop, 1440px fold)

**0–3 seconds (visual hierarchy):** Dark background. Left column: headline in white, 18–20px. Big number in white ($4.08). Right column: a form with stock selector buttons and amount slider. The most-animated object is a red-green bar chart showing cost allocation. All text is clear, no clipped text, no jargon.

**3–8 seconds (readability of the claim):** Headline reads: "THE MARK shows what a tokenized stock really costs you before you buy it on Solana, and stops the trade if that cost is more than you allow." Clear claim. A stranger knows the product's job in 6 words: *show cost → refuse high orders*.

**8–15 seconds (data comprehension):** The number $4.08 is labelled "extra on your $2,000 of Palantir." Below it: "EXTRA THIS ORDER COSTS" (green bar) vs "YOUR LIMIT 1.00%" (red mark). The bar is mostly green; the red mark is far to the right. Conclusion: "This order passes; I can trade." The button reads "CONNECT A WALLET TO PLACE THIS ORDER" (not greyed out, actionable).

**15–20 seconds (navigation):** Nav reads "CHECK AN ORDER / COMPARE STOCKS / VERIFY A TRADE" (at 1440px). The judge knows there are three views. The form shows live cost (Palantir: "0.20%" cost for this amount). The social card on the share link shows "$496 in price impact alone, on a $25,000 OpenAI order. 1.98% gone before you own a share." The social card is the strongest asset: it makes the loss visible and specific.

**Judge's mental model:** "This is not a dashboard. It's a guard. Before I sign, it shows the real cost. Different from the 14 other entries that show the token-share gap. But can I actually use it, or is this a mockup? I don't know yet."

---

## 3. STRONGEST THING & VISIBILITY WITHOUT SCROLLING

**Strongest:** The cost refusal guard — when the order exceeds the limit, the entire hero number turns red (e.g., $314.28 on a $25,000 Palantir order), the bar fills red past the limit line, and the button becomes a red "BLOCKED" box with explicit copy: "This order costs $314.28 extra, 1.26% of what you spend. Your limit is 1.00%." Below it: "What you can do instead" — live alternatives with savings: "Split it into three orders of $8,333, a few minutes apart so the pool can refill: about $129 in total, $185 less." This is the product's moral core: it stops you when the trade is bad, *and* it tells you what to do instead.

**Visibility without scrolling at 1440px:** YES. The blocked state, the alternatives panel, and the issuer powers ("The issuer can take tokens out of your wallet without asking you") are all above the fold or immediately visible at scroll depth 1.

**Visibility without scrolling at 390px:** PARTIAL. On mobile, the headline, number, and limit line are visible. The red BLOCKED box is not in the first fold; the user must scroll. The "What you can do instead" panel is below scroll depth. This is a medium-severity gap: on the device where most orders are placed (late night, on a phone), the refusal is not immediately visible.

**Why it wins:** In a field of 14 dashboards that only show data, this product makes a choice *for* you. A judge sees that shift instantly.

---

## 4. WEAKEST THING IN THE PRODUCT

**Critical (product-level):** The blocked-state alternatives panel, while present and helpful, has a sizing mismatch. The loss ($314.28) is rendered at 110px display type; the saving ($185 less) is body text. A stressed buyer sees the big red number first, and has to hunt for the green saving. The affordance is: "This order is terrible; look harder for the alternative." Should be: "This order is terrible, *but you can do this instead, same scale, green to show it's good*."

**High (mobile-specific):** On 390px, the "What you can do instead" panel does not appear in the first fold. A phone user sees a red number, a red BLOCKED box, and then has to scroll to learn there are alternatives. On a $25,000 order at 2 a.m. (63% of volume trades after-hours), a user who doesn't scroll thinks they have no options.

**High (census page, first paint):** The compare-stocks page loads with all bars showing "reading…" and no data. The 3D surface above the headline is a murky green/grey slab. A judge lands on /census and sees a broken page. This contradicts the "every call made at this moment" rule: the page should render yesterday's reading (dated) while fetching the live read, so the judge sees data immediately, not a loading spinner. The Ruler would mark this as a dead canvas.

**Medium (branding):** The logo glyph (small red bracket) cannot be read at 20px. The site lacks visual memorability. It reads as a competent tool, not a distinctive product. No animations, no motion, no micro-interactions. The "casino gold theme" mentioned in the CHARTER is absent. The dark+red+green palette is the default for any crypto dashboard. A judge reviewing 161 entries will not remember THE MARK's visual identity.

**Medium (social card):** The social card uses a different numeral font than the site (sans-serif vs mono). The timestamp "priced live when this card loaded" is helpful but not a feature; it should say "96 other Solana traders paid 2.56% to buy Intel today" or equivalent (turn data into story).

---

## 5. WINNER, FINALIST, OR PARTICIPANT NEXT TO THE FIELD

**Current standing:** **STRONG PARTICIPANT, UNSHIPPED**

**Field context:**
- 14 named dashboards: all show token-vs-share gap (0.20%, not worth drawing). None show fill cost before signing. None offer a refusal guard or alternatives.
- 8 yield-farming projects: The Mark does not compete here.
- 6 index/recurring/basket projects: The Mark does not compete here.
- ~130 invisible submissions: Unknown.
- Thinnest public field: agents and launchpads. The Mark is not an agent or launchpad.

**If deployed to a live URL by 2026-09-25 20:00 UTC with a working quote and a demo video:** **FINALIST (86–90/100).** Judges would:
1. Visit the live URL, see the rebuilt product works, verify the headline and blocked state.
2. Watch a 2-minute demo showing a real quote and a refused order.
3. Check the /proof page with a real mainnet transaction signature.
4. Rank THE MARK as clearly differentiated from the 14 dashboards.
5. Note the missing live signing, but credit the proof page and code discipline.

**If not deployed by deadline (pending links remain):** **PARTICIPANT, NON-COMPETITIVE (70–75/100).** Judges see a mockup. Without a live URL, GitHub, or video, they cannot verify the claim "it works end-to-end." In a 3-day hackathon with 161 entries, incomplete submissions are screened out in the first pass.

**Why the rebuild helped:**
- Headline now states the value prop (was absent in assess2).
- Default stock/amount now passes the limit (was blocked in assess2, making the button invisible).
- Blocked-state alternatives now shown (was blank advice in assess2).
- Issuer powers now in plain words (was jargon in assess2).
- Layout is now two-column at desktop, one at mobile (was one column everywhere in assess2).
- No background grid noise (was texture in assess2).

**Why it still falls short of "finalist" without deployment:**
- No live URL means no proof the app runs.
- No signed transaction means the Phantom integration is unproven.
- No demo video means judges who don't visit the live URL never see it working.
- No GitHub means code quality is unauditable.

---

## 6. FIVE HIGHEST-IMPACT CHANGES, RANKED BY POINTS PER HOUR

### 1. Deploy Live URL (Effort: 45 min | Gain: +6 points | ROI: 8 points/hour) — **CRITICAL**
Vercel deploy + seed wallet with $50 USDC + 0.05 SOL. Run a live quote on Palantir at $2,000 and $25,000 (to show passing and blocked states). Check that /census loads with live data (or yesterday's data, dated). Verify /proof loads with a real Solscan link to an example Intel trade from 2026-09-22.

*Why:* Judges see the product works. The built-in proof page validates the claim on mainnet. Moves entry from "mockup" to "product."

### 2. Record & Submit Demo Video (Effort: 90 min | Gain: +5 points | ROI: 3.3 points/hour) — **HIGH, AFTER DEPLOY**
2-minute voiceover + screen recording of:
- (0–30s) Headline and value prop.
- (30–60s) Quote a stock, drag the amount, hit the limit, show the refused state.
- (60–90s) Show the alternatives panel ("split into 3 orders") with live dollar figures.
- (90–120s) Switch to /census, point out the 40x spread (fill costs vary from 0.06% to 2.56%).
- (120s) Call out the /proof page.

Submit to YouTube (unlisted) or GitHub release. Judges who cannot test the live URL on deadline day will see the flow works.

*Why:* Visibility. In a 3-day hackathon, judges may not visit every live URL. The video moves the claim from "here is a feature" to "watch a stranger use it."

### 3. Test & Prove Signing (Effort: 30 min | Gain: +4 points | ROI: 8 points/hour) — **HIGH, PARALLEL WITH VIDEO**
Fund wallet with $10–20 USDC + 0.05 SOL. Connect Phantom on the live URL. Quote a stock at $500–$2,000. Click "Connect Wallet" → "Place Order" in the UI. Sign the transaction in Phantom. Paste the signature into /proof?sig=<signature> and verify:
- The /proof page decodes the transaction.
- It shows the cost in dollars and %.
- It reconciles the promised cost against the actual landed transaction.

Screenshot the /proof page. Paste it into the README's "Proof of Execution" section.

*Why:* Removes the largest unknown. SUBMISSION.md admits: "the signing path is code-reviewed, not exercised." Once you sign a transaction and /proof reconciles it, the last technical risk is gone.

### 4. Publish GitHub Repository (Effort: 30 min | Gain: +2 points | ROI: 4 points/hour) — **MEDIUM, AFTER DEPLOY & VIDEO**
Push to a public GitHub repo. Add:
- README with links to live URL, the demo video, and the signed transaction proof.
- RULES.md citing the three bans (no cached data, no fabricated figures, no celebration of trades).
- The cost math unit tests in /tests.
- CI/CD passing (linting, type check, test suite).

*Why:* Trust. Judges can inspect the code and verify execution quality. A live URL + video + GitHub repo is a complete submission.

### 5. Refine Blocked-State UX (Effort: 60 min | Gain: +1.5 points | ROI: 1.5 points/hour) — **LOW PRIORITY, POLISH**
On desktop: Move "What you can do instead" higher, and render the savings figure ("$185 less") at the same scale as the loss ("$314.28 extra"), side by side, in green, with a "Split it for me" button.

On mobile (390px): Move the "BLOCKED" box and the "What you can do instead" panel into the first fold (use CSS grid or flexbox to reflow). Do not hide the alternative behind scroll.

*Why:* UX polish. The current version is functional; this refine makes the guard friendly.

---

## 7. ONE-SENTENCE VERDICT

**The rebuilt product is strong and differentiated—it alone shows the real fill cost before signing and offers live refusal + alternatives—but without a live URL, GitHub, or demo video, judges cannot verify the claim works end-to-end; if deployed by 2026-09-25 20:00 UTC, it is a clear finalist against the 14 read-only dashboards; if not, it is an incomplete strong participant.**

---

## KEY FINDINGS SUMMARY

### Critical (block the score if not addressed by deadline)
1. **No live URL.** Judges see a mockup, not a working product. The entry is incomplete. Effort: 45 min. Impact: −7 points (the difference between 82→75).
2. **Signing path unproven.** SUBMISSION.md admits Phantom integration has not been exercised end-to-end. Mitigated by: (a) code review of Phantom SDK, (b) demo video showing a real recorded transaction, (c) /proof page with a real mainnet signature. Effort: 30 min (test signing) + 90 min (video). Impact: −4 points if judges see an error at signing time.

### High (major impact)
3. **No demo video.** PRD specifies a 2-minute script; video is ready to shoot. Judges who don't test the live URL won't see the flow. Effort: 90 min. Impact: −5 points.
4. **No GitHub repo.** Code quality is unauditable. Judges cannot verify the "no cached data" rule or inspect the WebGL2 surface. Effort: 30 min. Impact: −2 points.
5. **Census page loads with empty bars.** Should render last stored reading (dated "as of yesterday") while fetching live data. Currently shows "reading…" and appears broken. Effort: 60 min. Impact: −1.5 points per the Ruler (dead canvas finding).

### Medium (refinement)
6. **Blocked-state alternatives panel buried on mobile.** On 390px, "What you can do instead" is below scroll depth. Users on phones (63% of after-hours volume) don't see the guard. Effort: 60 min. Impact: −1 to −1.5 points.
7. **Logo glyph unreadable at 20px.** Red bracket cannot be identified as THE MARK's brand. Effort: 20 min (redraw at 28px+). Impact: −0.5 points.
8. **Blocked-state savings rendered smaller than loss.** $314.28 at 110px display vs. $185 less in body text. Effort: 20 min. Impact: −0.5 points.

### Low (visual identity)
9. **No animations or motion.** Every surface is static text on flat panels. The strongest finding (fill costs vary 40x) is not visually featured. Effort: 120+ min (add scroll-driven motion or transforms). Impact: −1 to −2 points (memorable is not essential; functional is).
10. **Dark + red + green is crypto-dashboard default.** No distinctive visual identity. Effort: 120+ min (rebrand). Impact: −1 point (judges do not anchor on aesthetics alone; they anchor on working product).

---

## COMPETITIVE CONTEXT & RESEARCH

**The 14 Named Dashboards:**
After Hours, Afterbell, STOCKNINE, stock.sh, GapGuard, Closing Bell, Henar, Multiplier, Sharelens, PreStocks Lens, MITIGATOR, tape-stocklana, noctis, fairfill.

Pattern: All show token-vs-share gap (0.20%, median). None show fill cost before signing. None offer a refusal guard. None provide alternatives. THE MARK is alone in all four.

**Bounty alignment:**
- **Tessera ($6k, t-tokens):** THE MARK supports tOpenAI and tKalshi. Reachable with minimal effort (mint list extension). Gap: t-token support is designed but not live-tested.
- **PreStocks ($10k):** THE MARK shows PreStocks xStocks. Gap: No PreStocks-specific agent or launchpad built.
- **Clawpump ($5k, stock-paired DBC):** THE MARK does not deploy an agent. Out of scope per PRD.
- **Meteora ($5k, new curves):** THE MARK uses Meteora pools but does not build a new curve. Out of scope.

**Historical patterns (winning Solana hackathons):**
Unruggable, Trepa, Pregame, TypeX, TapeDrive, CrowdBrain. Pattern: **one action a stranger can finish in two minutes, on a phone or wallet they already have, with a receipt on-chain.**

THE MARK fits the pattern. Action: (1) pick stock, (2) set amount, (3) review cost, (4) sign or refuse. Receipt: /proof page with a Solscan link. Time: 90 seconds. Device: any (works at 390px and 1440px). Proof: on-chain (transaction hash + decoded state).

---

## PRODUCT DISCIPLINE & HONESTY

**Rules the codebase follows (enforced):**
1. No figure on a surface unless returned by a call made in that moment. No sample data, no placeholder price, no remembered number, no fallback.
2. No chart of the token-vs-share gap (it is 0.20%, and everyone else is drawing it).
3. No green arrow, no confetti, no celebration of a trade. The product's claim is that it tells you the cost.

**Honesty applied:**
- 801,439 holders (Solana Compass, 12 Sep 2026) — sourced, dated, verifiable.
- $4.9B H1 volume — sourced (DEMAND.md), verifiable.
- Fill costs 0.06% (SPYx) to 2.56% (INTCx) on a $25,000 order — measured by the builder on 2026-09-22, live Jupiter API, raw rows in research/.
- Token-vs-share gap 0.20% median (20 pairs, 2026-09-22) — measured, sourced.
- Issuer powers ("can take tokens out of your wallet without asking") — read from on-chain mint account, specific per token, not generic FUD.

**Rated: Excellent honesty.** No "90% of traders don't check slippage" inferred claims. No aspirational copy. Numbers carry sources.

---

## ASSESSMENT METHODOLOGY

1. **Visual (screenshots):** Read 14 PNGs from assess3/ (home, census, proof at 390px and 1440px; blocked states). Compared against design/CHARTER.md rules and founder corrections from assess2 and CLAUDE.md.
2. **Product spec (PRD-V3):** Verified that the rebuild addresses the critical gaps from assess2/craft.md.
3. **Market research (research/grok-2026-09-22.md, research/BRIEF.md):** 175 sources, 23–30 public repos, field mapped, no competitors combining all four THE MARK features.
4. **Hackathon criteria:** Solana Foundation's stated question: "Could this be a real app people will actually use?" Checked against real users (801k holders), real problem (63% after-hours volume, no cost visibility), reason it belongs on Solana (pool cost is on-chain property, Token-2022 extensions read at quote time, proof is on-chain), and execution quality (unit tests, responsive, stateless).
5. **Honesty audit:** Verified all claims carry sources and dates. No fabricated figures. Explicit acknowledgment of what is not yet proven (signing path).

---

## RISK & MITIGATION

**Risk: Rate-limited free Jupiter key.** The PRD notes the lite-api key allows ~1 request per second. /census recomputes every 2 minutes for all 8 stocks × 3 sizes = 24 readings. Mitigation: PRD §Exception exempts /census from the "live call" rule; instead, it shows "one shared reading rebuilt at most every two minutes, with its age printed." This is honest and acceptable.

**Risk: Phantom signing fails on demo day.** The app works up to the signing point, then fails if wallet is unfunded or Phantom is not installed. Mitigation: Proof page can decode a *historical* transaction from 2026-09-22 (already on mainnet), so judges can see the reconciliation logic works even if live signing is not available on deadline.

**Risk: Jupiter or Solana RPC goes offline.** The app shows an error rather than a cached value (rule 1). This is the correct choice; it trades UX for honesty.

---

**Current status:** The rebuilt product is **82/100 and a strong participant, non-competitive without deployment.** If the live URL, GitHub repo, demo video, and signed transaction proof are shipped by 2026-09-25 20:00 UTC, the entry becomes **86–90/100 and a clear finalist.** Recommend: **deploy live URL in 45 min, then video in 90 min, then GitHub in 30 min, in that order, to maximize the probability a judge sees a working product.**
