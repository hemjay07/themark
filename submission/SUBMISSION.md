# THE MARK — Stocklana submission

**One line.** Before you buy a tokenized stock on Solana, THE MARK renders the pool you are about to
trade into, shows what your exact order really costs, and then signs or refuses.

## Links
- Live demo: _(pending deploy)_
- Repository: _(pending publish)_
- Demo video: _(pending)_
- Proof of a landed transaction: `/proof?sig=<signature>` on the live demo

## The claim, and how to check it
The field charts the token-vs-share gap. We measured it at a median 0.20% across 20 pairs on
2026-09-22. The cost that actually matters is the fill in the pool, which on the same day ranged
from 0.06% (SPYx) to 2.56% (INTCx) on a $25,000 order, a spread of roughly 40x.

Open `/census` and it recomputes that table live. Nothing on it is stored.

## Judging criteria
| criterion | where to look |
|---|---|
| Real user, real problem | `/census`, which measures the whole field live rather than asserting the problem |
| Working end-to-end demo | `/` quote to refusal to signature, then `/proof` reconciling the landed transaction |
| Belongs on Solana | Cost is a property of the pool being quoted; the Token-2022 multiplier and transfer fee are read off the mint account at quote time |
| Quality of execution | Hand-written WebGL2 for the pool surface, no 3D library; unit-tested cost math; every surface measured at 390px and 1280px |
| Differentiation | 14 public dashboards in this field show the gap; this shows the fill cost before you sign, and then refuses |

## What is proven, and what is not
- **Tested:** the cost math has unit tests; every mint, decimal and liquidity figure was verified
  against live Jupiter and RPC responses; all three surfaces measure clean at both widths.
- **Proven on chain:** `/proof` decodes a real landed mainnet transaction and reconciles it.
- **Not yet proven:** a signature originated by this app against a funded wallet. Until that runs,
  the signing path is code-reviewed, not exercised.

## Honesty rules this codebase follows
No figure reaches a surface that was not returned by a call made in that moment. No sample data, no
placeholder price, no remembered number, no cached fallback. When a call fails the surface says so
and shows nothing in its place.
