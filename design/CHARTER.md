---
thesis: "Before you buy a tokenized stock, THE MARK shows what your exact order really costs, lets you set the worst fill you will take, then signs or refuses."
skim_seconds: 3
stack: next-dev
signal_colours:
  - hex: "#C4261D"
    means: "the cost this order pays, and the refusal"
  - hex: "#0B7A3B"
    means: "the fill accepted, and the amount not paid"
depth_level: 0
depth_reason: "The subject is a number a stranger must trust in three seconds; hairlines and one signal colour carry it, and the ceiling research found 0 of 15 praised crypto sites ship depth on the fold."
motion:
  cap_ms: 1600
  easings: 2
  durations: { tick: 90, element: 180, data: 320, count: 1400 }
device:
  renders: "the fill-cost meter: the percentage this exact order pays over the price of the real share, quoted live from the route it would take"
  source: data
  swap_test: "Swap the product's name and thesis and the meter becomes a lie: it exists only because the number is quoted against the route you are about to sign, one second before you sign it. A dashboard cannot have it."
genre: "instrument"
wonder: "You drag the amount from 500 to 25,000 dollars and the cost meter counts from 0.75 to 2.80 percent in front of you, the pool being eaten as you watch, until the sign button turns into a refusal."
hero_technique: "number-odometer"
faces:
  display: "Archivo"
  text: "Archivo"
  mono: "JetBrains Mono"
references:
  - name: "owid-grapher"
    take: "colour only on the data and chrome achromatic; radius 2px on 275 elements; two shadows total, one a 1px inset ring, so edges are hairlines not elevation"
  - name: "onchainrouter"
    take: "every number is read live at request time or it is not shown (force-dynamic on the landing); one named transition token, --ease 160ms, not twelve literals"
  - name: "gmgn"
    take: "a tool surface earns density: 591 elements above the fold at 1280, display 16px, no headline at all; the audience is a trader who reads that without complaint"
parts: ["number-odometer", "hairline-grid", "mono-address"]
bans:
  - "no figure on the surface that was not returned by a call made in that moment: no sample data, no placeholder price, no remembered number"
  - "no chart of the gap between the token and the share: it is 0.20% median and fourteen other teams in this hackathon are drawing it"
  - "no green arrow, no confetti, no celebration of a trade: the product's whole claim is that it tells you the cost"
byte_budget_kb: 300
surfaces:
  - route: "/"
    headline: "this order pays 1.41% over the share"
    moment: "the cost meter counting as the amount changes, and the button becoming a refusal"
    primary_action: "set the worst fill you will take, then sign or walk"

---

THE MARK is a guard in front of one click. A holder of tokenized stocks on Solana buys at two in the morning,
when 63% of this volume trades and the books are thinnest, and nothing tells them what the order costs. We
measured it on 2026-09-22: a 500 dollar order of PLTRx pays 1.41% in price impact, a 5,000 dollar order of
INTCx pays 1.87%, and the same order in SPYx pays 0.01%. The gap between the token and the real share, which
fourteen other teams here are charting, is a median 0.20%. The cost is in the pool, not in the gap.

The surface exists to say one thing: this is what your order costs, in percent and in dollars, against the
price of the actual share. From owid-grapher it takes the instrument posture, colour only where there is data
and edges drawn by hairline. From onchainrouter it takes the rule that a number is read live or not shown at
all. From gmgn it takes permission to be dense, because the reader is a trader who is used to it.

It breaks one convention of its genre. Every other surface in this category is built to make you trade. This
one is built to stop you when the trade is bad, and the largest, most animated thing on the page is the number
that argues against the button beneath it. It is not a terminal and it is not a dashboard: it shows one order
at a time and it has no opinion about the market, only about the fill.
