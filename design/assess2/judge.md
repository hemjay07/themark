# HACKATHON JUDGE ASSESSMENT: THE MARK
**Project:** THE MARK | **Hackathon:** Stocklana (Solana Foundation) | **Assessment Date:** 2026-09-22  
**Assessor:** Independent Judge | **Previous Score:** 72/100 | **Current Status:** Revamp (UI, issuer powers, routing, pool background, icon, social card)

---

## 1. SCORE: 79/100 (Screenshots + Documentation as Submitted)

### Breakdown by Official Judging Criteria

| Criterion | Score | Evidence | Gap |
|-----------|-------|----------|-----|
| **Real User, Real Problem** | 19/20 | 801,439 token holders (Solana Compass 12 Sep 2026); $4.9B H1 volume; 63% after-hours trading; measured fill costs 0.06%–2.56% (40x spread) on 2026-09-22; named complaints (@RStudios64042, @gupta_kanv, @DYORTerminal); median token-vs-share gap 0.20% across 20 pairs. | *Minor:* Proof of transaction originating from this app not yet demonstrated (marked "not yet proven" in SUBMISSION.md). |
| **Working End-to-End Demo** | 10/20 | Screenshots show the complete flow: quote form → cost breakdown with refusal guard → receipt with Solscan link. Three surfaces (/instrument, /census, /proof) are visually complete and responsive (tested 390px, 1440px). | *Critical:* Live URL marked "pending deploy"; cannot verify app actually runs. No recorded demo video. No testable end-to-end flow. Judge can see the design, not the behavior. |
| **Belongs on Solana** | 18/20 | Cost is a property of the pool you quote at quote time (on-chain); Token-2022 mint extensions (scaledUiAmountConfig, transferFeeConfig) read at quote time and factored into cost; refusal + receipt are the same transaction; /proof decodes mainnet transactions and reads live extension state. PRD §"The on-chain finding" is technically sound. | *Minor:* Tessera t-token integration is designed but not verified live. |
| **Quality of Execution** | 14/20 | Stack: Next.js 14 (app router), TypeScript, hand-written WebGL2 (no 3D library), Jupiter API integration, unit-tested cost math, responsive TailwindCSS (mobile-first), stateless (no persistent storage). Code structure and API contracts are well-documented. | *Moderate:* UI is functionally clean but minimal/raw aesthetic (dark backgrounds, sparse branding). "Casino gold theme" mentioned in CLAUDE.md but not visibly polished. GitHub repo not yet published; code quality cannot be independently verified by judge. |
| **Differentiation** | 18/20 | 14 named public dashboards in Stocklana field show token-vs-share gap (0.20%, "not worth drawing"). THE MARK alone shows the *fill cost before signing*, the *refusal guard* (slider to block high-cost trades), and the *proof* (receipt reconciliation). No competitor combines all three. | *Minor:* fairfill (price router) exists, but this is a refusal + receipt, not a router; the distinction is clear but must be visibly obvious in first 5 seconds (it is, via hero copy). |

**Subtotal from criteria: 79/100**

---

## 2. WHAT A JUDGE CONCLUDES IN 20 SECONDS (First Fold)

**Visual (0–5s):** Dark theme, two-column layout. Left: bold headline "Buying a stock on Solana? You are probably overpaying, and nothing tells you by how much." Right: interactive cost breakdown showing $77.49 cost on $5000 order (1.55%).

**Takeaway (5–15s):** "This is not about the token-share gap (0.20%; everyone else charts that). This is about price impact. Before you sign, it shows what you actually pay."

**Navigation visible (15–20s):** Three tabs: INSTRUMENT (active, showing the quote), CENSUS (data table), PROOF (receipt verify). Hero text: "You do not need a wallet to use any of this. Everything below is live right now."

**Judge's mental model:** "Unique angle. The problem is real (801k holders, $4.9B volume). The solution is simple: show the cost, let me refuse if it's too high, give me proof. Different from the other 14 dashboards. But is this live, or just a mockup?"

---

## 3. STRONGEST THING & VISIBILITY WITHOUT SCROLLING

**Strongest:** The cost breakdown on the home fold right-hand column — it renders the constant-product pool surface as a visual trench, shows "YOU KEEP" vs "GOES TO COSTS" in green/red, displays the per-share cost ($124.51 paid vs $123.40 real), and warns "1.55% of your order" in red. This single graphic *proves* the claim: "Your order costs this much, and here's where the money goes." It is data journalism, not a dashboard.

**Visibility without scrolling:** **YES, fully visible.** The cost breakdown is the entire right column of the fold. The user can see:
- Input stock selector ($500–$25,000)
- Reference share price vs on-chain price (gap shown)
- All-in cost in dollars and percent (**$77.49 red, 1.55% red**)
- Kept vs lost allocation (green/red bar)
- Per-share cost comparison ($124.51 vs $123.40)
- Limit slider (0–5% range) and block warning ("BLOCKED: This order would cost you... which is... of what you are spending")

**Why it wins:** A judge sees the claim ("show the cost") *proved* in the first 5 seconds with a number they can check themselves (1.55% on a $5,000 order).

---

## 4. WEAKEST THING

**Critical Weakness:** Incomplete submission. The SUBMISSION.md file lists:
- Live demo: "_(pending deploy)_"
- Repository: "_(pending publish)_"
- Demo video: "_(pending)_"

In a 3-day hackathon (deadline 2026-09-25 20:00 UTC), "pending" means the entry is not yet complete. Judges cannot:
1. Visit the live URL to verify the app runs
2. Test the end-to-end flow (quote → approve → receipt)
3. Verify that Phantom signing actually works
4. Check the GitHub code for review

**Secondary Weakness:** The signing path is not yet proven. SUBMISSION.md explicitly states: "Not yet proven: a signature originated by this app against a funded wallet. Until that runs, the signing path is code-reviewed, not exercised." This is a honest disclosure, but it means the riskiest part of the flow (Phantom wallet integration + transaction confirmation) has not been tested end-to-end.

**Tertiary Weakness:** UI polish is minimal. The aesthetic is dark, functional, and readable, but not visually distinctive. No animations, no micro-interactions, sparse use of the "casino gold" theme mentioned in the CLAUDE.md rules. For a judge scanning submissions, it reads as "prototype" rather than "product."

---

## 5. STANDING: FINALIST vs PARTICIPANT

**Current Status:** **STRONG PARTICIPANT, INCOMPLETE ENTRY**

- **If the live URL, GitHub, and video deploy by 2026-09-25 20:00 UTC and the signing works:** **FINALIST (86–90/100).** Judges would see a working product, prove the claim, and rank it against the field (clearly differentiated from the 14 dashboards).
- **If any of the three (URL, GitHub, video) remains pending at deadline:** **PARTICIPANT, NON-COMPETITIVE (72–74/100).** Judges cannot verify the core claim: "it works end-to-end."
- **vs. the field:** THE MARK is alone in showing the fill cost + refusal + proof. The 14 dashboards all show the gap. No public competitor combines all three. It has a clear win if it ships.

---

## 6. THREE HIGHEST-IMPACT CHANGES, RANKED BY POINTS PER HOUR

### Change 1: Deploy Live URL & Test End-to-End Transaction (Highest ROI)
- **Effort:** 45–60 minutes (deploy to Vercel, fund wallet ~$20 USDC + 0.02 SOL, run a live quote, sign with Phantom, wait for confirmation)
- **Points gained:** +7–10 (moves from 79→86–89)
- **Why:** Judges can see it work. The /proof page can validate a real transaction. The claim is *proven*, not asserted.
- **Blocker:** If Jupiter API is rate-limited or Phantom signing fails, this cascades into the video. Highest risk, highest reward.

### Change 2: Record & Submit Demo Video (Highest Visibility)
- **Effort:** 90–120 minutes (follow PRD §6, record 2 min voiceover + footage, upload to YouTube/GitHub)
- **Points gained:** +5–8 (moves from 86→91–94)
- **Why:** Demo script in PRD is complete (6 scenes, voiceover). Video shows the flow visibly. Judges who cannot visit the live URL on deadline day still see it works.
- **Note:** Video should show a *real* recorded transaction from 2026-09-22 or later, not a replay. PRD explicitly states "historical (not live replay)" if wallet is unfunded during demo window.

### Change 3: Publish GitHub Repository (Highest Trust)
- **Effort:** 30 minutes (push to GitHub, add README with links, verify CI/linting passes)
- **Points gained:** +3–5 (moves from 91→94–96)
- **Why:** Code review validates execution quality. Judges can inspect the WebGL2 pool surface, the cost calculator unit tests, the Jupiter integration. Transparency builds credibility.
- **Note:** README should include the "Rules" from top-level README.md: no cached figures, no fabricated data, refusal when API fails.

---

## 7. ONE-SENTENCE VERDICT

THE MARK has a winner-level idea (showing the fill cost before signing, alone among 161 Stocklana entries) and solid execution (responsive, data-driven, on-chain proofs), but the submission is incomplete—live demo, GitHub, and video remain pending, so judges cannot verify the claim works end-to-end; if deployed by deadline, it is a finalist; if not, it is a strong participant that did not finish.

---

## CRITICAL FINDINGS SUMMARY

### Critical (Must Fix)
1. **Live URL not deployed.** Without a working app, judges see a mockup, not a product. Effort: 45 min. Impact: +7 points (decisive).

### High (Strong Impact)
2. **Signing path not proven.** SUBMISSION.md admits the Phantom integration has not been exercised. Mitigated by: (a) code review of Phantom SDK calls, (b) demo video showing a real recorded transaction. Effort: 90 min (video). Impact: +5 points.
3. **No demo video submitted.** PRD specifies 2-min script with 6 scenes; video is ready to be recorded. Effort: 90 min. Impact: +5 points.
4. **GitHub not published.** Code quality cannot be verified independently. Effort: 30 min. Impact: +3 points.

### Medium (Refinement)
5. **UI polish is minimal.** Functional but not visually distinctive. No animations or micro-interactions. The "casino gold theme" is mentioned but under-used. Impact: −1 to −2 points if noticed by design-focused judges. Effort to fix: 60 min (would require rebrand).

---

## RESEARCH: COMPETITIVE CONTEXT

**The Field (14 Named Public Dashboards):**
- After Hours, Afterbell, STOCKNINE, stock.sh, GapGuard, Closing Bell, Henar, Multiplier, Sharelens, PreStocks Lens, MITIGATOR, tape-stocklana, noctis, fairfill.
- **Common pattern:** Jupiter + Pyth + Finnhub → table with token-vs-share gap (median 0.20%), sometimes paper-trade feature.
- **Gap:** None show the fill cost *before signing* or a refusal guard.

**Tessera Bounty ($6k):**
- THE MARK's t-token support (tOpenAI at 19% gap vs xStocks at 0.20%) qualifies. Reachable with minimal effort (mint list + cost calc extend).

**Why THE MARK Wins If It Ships:**
- Only product showing the fill cost + refusal + proof.
- Proof is on-chain (Solscan link, transparent).
- Data is live (recomputed on every page load, no cache).
- The claim is measurable by any judge in 2 minutes: go to /census, pick a stock, see the fill spread, check one quote against their own wallet.

**Why It Might Not Ship:**
- Incomplete at deadline (pending links). Judges have 161 entries to evaluate; incomplete submissions are screened out fast.
- Signing path unproven. If Phantom fails during live demo window, judges see an error, not a proof.

---

## HONESTY RATING: EXCELLENT

All claims in the PRD and README carry specific numbers with measured sources:
- 801,439 holders (Solana Compass, Sep 12 2026)
- $4.9B H1 volume (DEMAND.md)
- Fill costs: 1.41% PLTRx, 1.87% INTCx, 0.06% SPYx (measured 2026-09-22)
- Gap median 0.20% (20 pairs, 2026-09-22)

No "90% of traders don't check slippage" or other inferred claims. Honesty rules (no cached data, no fabricated figures) are enforced in code. This is rare in hackathons.

---

**Status:** As submitted (design + docs), the entry is **79/100 and non-competitive without live demo.** If the three pending items ship by deadline and signing works, **86–90/100 and a finalist.** The revamp (UI, issuer powers, routing, icon) is not yet visible live, so its impact on the 72→79 improvement cannot be independently verified. Recommend: ship the live URL first (45 min), then video (90 min), then GitHub (30 min), in that order, to maximize the probability a judge sees a working product.
