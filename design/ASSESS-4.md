# ASSESS-4 (2026-09-24, on build 1ac2c27 and after)

Three independent assessors (a hackathon judge, a product designer, and a DeFi engineer on numbers and trust) worked from the v31 screenshots and the repo. Each claim below was checked against the code or the screenshots before it was acted on.

## Coverage

| Finding | Judge | Designer | Trust | Verified | Outcome |
|---|---|---|---|---|---|
| No live URL, no video, no signed trade | yes | | | yes (SUBMISSION.md) | founder-gated: T006, T007, T008 |
| Proof example is a trade that did not overpay | yes | yes | yes | yes | fixed: a real $150.93 OpenAI buy that overpaid $2.82 (1.9%) |
| RefusalGuard dead code with the wrong metric and a "bps" label | | | yes | yes, plus 8 more unused components | fixed: 9 orphans deleted |
| Memorability / identity is serviceable, not signature | yes | yes | | judgement | open |
| Census cold start of ~25 s after each deploy | | | yes | yes | warm /api/census after deploy (T006 step) |
| Phone limit labels collide | | yes | | **no**: the 390 screenshot shows them apart, and check-v31 #3 measures it | none |
| Split advice needs a button | | yes | | not applicable: a split is three orders over minutes, not one click | none |
| Compare and split features missing | yes | | | **no**: both exist (/census, the split line) | none |
| Census footer says "ten minutes" | yes | | | **no**: no such string in src | none |
| Census footnote names the API | | yes | | **no**: check-v31 #5 refuses any API name | none |

## Gap no assessor caught (found while verifying)
**After a successful trade the page showed nothing.** `page.tsx` built a receipt into state, but nothing rendered it: the Receipt component was one of the orphans. Fixed: a landed trade now goes to `/proof?sig=<signature>`, which reads the trade off the chain and gives the person a link they can keep.

## Found by running the checks, before the assessors
- Palantir was too volatile to open the page on (0.54% to 1.26% at $25k within two hours). The default is now OpenAI at $25k with a 1% limit.
- Order cost is not monotonic in size. Buy-less now suggests only sizes that pass two quotes under 90% of the limit, and says so when no size fits.

## Evidence
check-proof PASS, check-v31 PASS, check-v3 PASS, jest 22/22, and the Ruler is clean on /, /census, /proof and a proof result at 390 and 1440.

## Still open
1. Deploy (T006), the mainnet trade (T007), the video (T008), and the design approvals: all need the founder.
2. Identity and memorability: both judgement lenses rate it serviceable. No fix is planned yet.
