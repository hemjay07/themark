---
thesis: "Before you buy a tokenized stock, THE MARK renders the pool you are about to trade into, shows what your exact order really costs as it eats that pool, then signs or refuses."
skim_seconds: 3
stack: next-dev
signal_colours:
  - hex: "#C4261D"
    means: "the cost this order pays, and the refusal"
  - hex: "#0B7A3B"
    means: "the fill accepted, and the amount not paid"
depth_level: 3
depth_reason: "The subject is a constant-product curve, a real lit surface with a real shape, and the order is a path carved along it; at level 0 that shape can only be asserted in a label, and the founder rejected the level-0 build as plain. Ceiling research finding that 0 of 15 praised crypto sites ship depth on the fold is the argument FOR shipping it, not against."
motion:
  cap_ms: 1600
  easings: 2
  durations: { tick: 90, element: 180, data: 320, count: 1400 }
device:
  renders: "the live constant-product curve of the exact pool being quoted, lit and rendered in WebGL, with the order carved into it as a trench whose depth is the price impact this order pays"
  source: data
  swap_test: "Swap the product's name and thesis and the curve becomes decoration: its shape is x*y=k for the one pool this quote routes through, its depth is the impact the router returned one second ago, and the trench moves because the amount in the field moved. No other product can draw this surface because no other product is quoting this order."
genre: "instrument"
wonder: "You drag the amount and a trench opens in the lit pool surface in front of you, deepening as the cost meter counts, until the trench breaks the line you set and the sign button becomes a refusal."
hero_technique: "shader-plane"
faces:
  display: "Archivo"
  text: "Archivo"
  mono: "JetBrains Mono"
references:
  - name: "unseen"
    take: "the lit scene as the subject, not a backdrop: longestMs 1000 with 2 easings and 28px display, so the motion is the content and the type stays quiet"
  - name: "basement"
    take: "type sits ON the 3D rather than beside it; hairlineA 0.925 and maxRadius 0.3 keep every edge a rule, so depth never becomes softness"
  - name: "owid-grapher"
    take: "colour only on the data and chrome achromatic; 2 shadows total, radius 2px, sources stated on the chart itself"
  - name: "onchainrouter"
    take: "every number is read live at request time or it is not shown; one named transition token, not twelve literals"
  - name: "gmgn"
    take: "a tool surface earns density: 481 elements above the fold at 1280, display 16px, no headline; the audience is a trader who reads that without complaint"
parts: ["shader-plane", "number-odometer", "hairline-grid", "grain-overlay", "mono-address"]
bans:
  - "no figure on the surface that was not returned by a call made in that moment: no sample data, no placeholder price, no remembered number"
  - "no chart of the gap between the token and the share: it is 0.20% median and fourteen other teams in this hackathon are drawing it"
  - "no green arrow, no confetti, no celebration of a trade: the product's whole claim is that it tells you the cost"
# Exception to ban 1, decided 2026-09-23: on the free Jupiter key (1 request a second) a per-visitor
# census took ~26s to fill. The founder chose not to pay for a higher plan, so /census shows ONE shared
# reading rebuilt at most every two minutes, with its age printed on the page. Every figure is still the
# answer to a live call; the instrument on / stays live per order.
byte_budget_kb: 900
surfaces:
  - route: "/"
    headline: "this order pays 1.41% over the share"
    moment: "the trench opening in the lit pool as the amount moves, and the button becoming a refusal"
    primary_action: "set the worst fill you will take, then sign or walk"
  - route: "/census"
    headline: "the gap is 0.20%, the fill is up to 9x larger"
    moment: "every tokenized stock measured at three order sizes at once, live, ranked by what it actually costs"
    primary_action: "find the pool that will not hold your order"
  - route: "/proof"
    headline: "this receipt came off the chain, not off this page"
    moment: "a landed transaction reconciled line by line against what the screen promised before it was signed"
    primary_action: "check the signature on Solscan yourself"
---

THE MARK is a guard in front of one click. A holder of tokenized stocks on Solana buys at two in the
morning, when 63% of this volume trades and the books are thinnest, and nothing tells them what the
order costs. We measured it on 2026-09-22: a 500 dollar order of PLTRx pays 1.41% in price impact, a
5,000 dollar order of INTCx pays 1.87%, and the same order in SPYx pays 0.01%. The gap between the
token and the real share, which fourteen other teams here are charting, is a median 0.20%. The cost
is in the pool, not in the gap.

The pool is the subject, so the pool is what gets rendered. A constant-product market is a real
curve with a real shape, and an order is a walk along it that leaves a trench. Drawing that trench
is not decoration: its depth is the impact the router returned for this exact amount, one second
ago. From unseen it takes the rule that the lit scene is the content and the type stays quiet. From
basement it takes type sitting on the geometry with every edge still a rule. From owid-grapher it
takes colour only where there is data and the source stated on the artifact. From onchainrouter it
takes the rule that a number is read live or not shown. From gmgn it takes permission to be dense.

It breaks one convention of its genre. Every other surface in this category is built to make you
trade, and renders nothing because there is nothing true to render. This one is built to stop you
when the trade is bad, it renders the thing you are trading into, and the largest, most animated
object on the page is the argument against the button beneath it. It is not a terminal and it is not
a dashboard: it shows one order at a time and it has no opinion about the market, only about the fill.
