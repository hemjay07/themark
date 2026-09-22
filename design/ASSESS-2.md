# ASSESS-2 — the whole product after the revamp (2026-09-22, ~23:00Z)

Three independent lenses, none saw the others: craft & brand (render-judge, pixels only),
product & feature depth (walked the flows in a browser), hackathon judge (scored vs the field).
All three worked from design/shots/assess2/ — 16 shots at 1440 and 390, taken after data loaded.
Full reports: design/assess2/craft.md, product.md, judge.md.

## Coverage matrix
| finding | craft | product | judge | confidence |
|---|---|---|---|---|
| The one object only this product could have is not the hero of the fold | yes (critical) | yes (critical) | — | high, 2/3 |
| Visually a dark form in a card; not distinctive | yes (critical) | — | yes | high, 2/3 |
| Live URL, video, public repo missing; biggest score lever | — | — | yes (critical) | 1/3, but uncontested |
| Fold numbers contradict: $77.49 cost vs "0.89% / $44.44" line vs copy about "$500 of Palantir" while INTCx $5000 is selected | yes (high) | — | — | 1/3, verified on screen |
| At 390 the first screen has no instrument and no number | yes (critical) | — | — | 1/3, verified on screen |
| /proof demo path ends in red "REFUSED ... no live reference price" | yes (high) | — | — | 1/3, verified on screen |
| Census opens on the best (empty) rows and hides the finding | yes | yes | — | high, 2/3 |
| Missing depth: compare, split the order, "what should I do instead", sort/filter | — | yes (high) | — | 1/3 |
| Wordmark shares nothing with the icon; OG card has an em dash and a stale-able live number | yes | — | — | 1/3 |
| Signing path never exercised | — | — | yes | 1/3, known |

## Contradictions resolved
- Judge calls the cost block "fully visible, the strongest thing"; craft says the headline outranks it.
  Both are true: it is visible, and it is second. The founder's own rule decides it — the one thing a
  surface exists to say is the biggest thing on it. The number wins; the headline becomes a caption.
- Craft says make the limit line the hero object; product says make the pool the hero, draining as you
  type. These are the same object: the charter's wonder line is the trench deepening until it crosses the
  line you set and the button becomes a refusal. Build that, once, as the fold.

## What all three missed
- Rate limiting is systemic, not incidental. The /proof failure, the earlier "no read" rows, and the
  empty fold the founder saw are one cause: the public Jupiter endpoint throttling this IP. A judge on a
  cold browser will hit it. No lens named it as a class.
- Nobody checked accessibility or keyboard use of the limit and slider controls.
- Nobody tested the app with a wallet connected. The signing UI has never rendered in its connected state.

## Verdict
Winner-level idea, sound engineering, and a surface that still reads as a calculator in a dark card.
The judge scores it 79 as it stands and 86-90 if it ships live with a video. The founder has rejected
it five times for the same reason all three lenses name: the object only this product could have —
the order carving into the pool and crossing your line — is not what you see first, at either width.

## Revamp plan (each item is a ledger task that closes on a command)
1. Fold: the rendered pool + limit line + the dollar cost as one hero object, first screen at 1440 and
   390; headline shrinks to a caption; moving the amount deepens the trench live.
2. One truthful set of numbers on the fold; copy follows the selected stock and amount.
3. /proof demo path must succeed on a cold browser; rate limiting handled centrally, not per call.
4. Census opens on the finding (worst pool first, the spread as the headline number).
5. Depth: "split this order" and "cheapest way to buy this exposure" — both answerable from live quotes.
6. Brand: wordmark built from the icon's post-and-bar; OG card without the em dash or a stale-able figure.
7. Type with a voice: a display face that belongs to the wordmark; body copy cut to one line per idea.
8. Ship: live URL, public repo, real trade, video (founder-gated).
