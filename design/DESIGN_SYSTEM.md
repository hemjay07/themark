# DESIGN_SYSTEM.md -- extracted from design/proto/A.html by spec.mjs, 2026-09-22

## Identity
thesis: Before you buy a tokenized stock, THE MARK shows what your exact order really costs, lets you set the worst fill you will take, then signs or refuses.
signal colours: #C4261D = the cost this order pays, and the refusal; #0B7A3B = the fill accepted, and the amount not paid
depth level: 0 (The subject is a number a stranger must trust in three seconds; hairlines and one signal colour carry it, and the ceiling research found 0 of 15 praised crypto sites ship depth on the fold.)
device: the fill-cost meter: the percentage this exact order pays over the price of the real share, quoted live from the route it would take (source data)
bans: no figure on the surface that was not returned by a call made in that moment: no sample data, no placeholder price, no remembered number; no chart of the gap between the token and the share: it is 0.20% median and fourteen other teams in this hackathon are drawing it; no green arrow, no confetti, no celebration of a trade: the product's whole claim is that it tells you the cost

## Tokens (design/TOKENS.css is the source; this is the reading)
ground rgb(10, 10, 15) (L 0.147) · ink rgb(250, 250, 250) (L 0.985) · signal none · hairline rgb(39, 39, 42) (alpha 1)
hue buckets: none · radius 8px · shadows 0
fonts: Archivo x16, JetBrains Mono x11 · body weight 400
display 32px "You end up 0.61% below the share" at 1280; 22px "You end up 0.61% below the share" at 390
above the fold: 37 elements at 1280, 40 at 390

## Craft
- radius: one value (8px); the prototype also used 8px, 2px, 6px: pick one or write the exception here
- depth: hairlines and surface steps only, no shadows
- hairline: rgb(39, 39, 42)
- hover / focus-visible: (write the recipe: what changes, which duration token)

## Primitives (from the prototype inventory; name the ones that recur)
- .headline: div 14px/400 "The Mark · A"
- .meter-color.good: span 32px/400 "0.61"
- .amount-label: div 12px/400 "Amount (USD)"
- .axis-section: div 16px/400 "mark-axis-a"
- .receipt-value: span 14px/400 "0.75%"
- .receipt-label: span 13px/400 "Your order pays"
- .receipt-value: span 14px/400 "$3.75 on $500"
- .receipt-label: span 13px/400 "That is dollars and cents"
- .receipt-value: span 14px/400 "$181.86"
- .receipt-label: span 13px/400 "Token price"
- .receipt-value: span 14px/400 "$184.37"
- .receipt-label: span 13px/400 "Share price"
- .receipt-value: span 14px/400 "token 1.36% below"
- .receipt-label: span 13px/400 "Basis"
- .receipt-value: span 14px/400 "0.03% of pool's $271K"
- .receipt-label: span 13px/400 "Your order takes"
- .multiplier-note: div 11px/400 "this mint's multiplier is 1, so the wallet shows the same units"
- .info-label: div 11px/400 "Worst fill you will take"
- .info-label: div 11px/400 "Above that line"
- .action-button: button 14px/400 "Set and sign"

## Motion (design/MOTION.md holds the causes)
easings: cubic-bezier(0.23, 1, 0.32, 1); ease-out (2 of max 3)
durations seen: 120, 1400 ms · longest 1400 ms · cap 1600 ms


## Acceptance checklist (each is a finding at Stop when it fails)
- [ ] the shipped :root matches TOKENS.css (drift.mjs reports no drift)
- [ ] every surface's headline is its largest text at 390 and 1280 (measure.mjs)
- [ ] hue buckets on any surface <= 1; signal colour only where it means "the cost this order pays, and the refusal"
- [ ] radius 8px only; shadows 0
- [ ] easings <= 2, longest transition <= 1600 ms, nothing starts at opacity 0
- [ ] bytes at 390 <= 300 KB
- [ ] the device renders on every surface the charter lists it on
- [ ] TRANSFER.md fully ticked before the route is called done
