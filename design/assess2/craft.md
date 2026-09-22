# THE MARK: design craft and brand assessment (2026-09-22)

I looked at all 16 shots in `/Users/mujeeb/themark/design/shots/assess2/`, plus `og.png`, `icon-512.png`, `FOUNDER.jsonl`, and two ceiling references: basement and lusion.

## 1. Tier today (critical)

This is a well-built dark finance dashboard with one accent colour. It would sit around the top quarter of hackathon entries. It is nowhere near the top 0.1%.

Basement's first screen is a lit 3D room you can walk through. Lusion's is a pile of glossy rendered objects that fills the screen. Both are built around a single image you remember. THE MARK's first screens are a headline, a paragraph, three pill labels and a form in a card.

The founder has already judged this kind of page: "this is simple and plain, it might work in some context but I dont think its memorable or counts as an impressive UI" (2026-09-19). Nothing is broken, but by his own rule that is "the floor, not the bar".

## 2. What each first screen says in three seconds

**Home at 1440 (high).** The biggest thing is the four-line headline, "Buying a stock on Solana? You are probably overpaying…". The red **$77.49** is second, off to the right. His rule is "The one thing a surface exists to say is the biggest thing on it" (2026-09-18). The thing this product exists to say is that number, so the headline is wrong to outrank it.

The fold also contradicts itself:
- The number says $77.49 of costs, or 1.55%.
- The last line says "0.89% dearer… about $44.44 on $5000".
- The body copy talks about "$500 of Palantir" while the instrument has INTCx selected at $5000.

A stranger reading that can't tell which number to trust.

**Home at 390 (critical).** The phone's first screen has no instrument and no number. It is a headline, 90 words of body copy, three pills and a "census" card. The product can't be seen at phone width.

**Census at 1440 and 390 (high).** The biggest thing is a lowercase headline: "the gap is the same for everyone. the fill is not." It is a phrase you have to work out, not a fact. The 3D slab above it is squeezed into a strip about 190 px tall. It is cropped, fades into the background, and reads as a green smudge rather than an object. The ranking puts the best token first, so the first rows on screen are SPYx at 0.00% with empty bars. That hides the finding this page exists for: 524x worse.

**Proof at 1440 (medium).** "this receipt came off the chain, not off this page" is the right size, and the white button, CHECK A REAL TRADE, makes the click obvious. The rest is grey monospace prose.

**Proof at 390 (medium).** The input placeholder wraps as "Solana trad / e". That is a clipped word, which his "nothing clipped" rule (2026-09-18) forbids.

**Proof with a signature at 1440 (high).** The result of pasting a signature is a red REFUSED box: "no live reference price… ; refusing to reconcile". The demo path ends in failure, with a semicolon in indexer vocabulary (rules of 2026-09-15). Below it, 60% of the screen is empty.

## 3. Is there a design idea? (critical)

A small one: the **limit line**. There is a white post, a red bar running past a dashed "your limit" marker, and a BLOCKED state. The icon draws the same shape. That is the only thing on screen that could only exist for this product.

It is buried. It sits about 700 px down on desktop, the same size as everything else, and inside a card. Everything else is a form in a dark card: chips, a slider, split bars, a list of risk flags.

The founder asked for "thinking outside the box… import libraries, 3d model" (2026-09-19). The one 3D object on the site is the census strip, which doesn't read.

## 4. Branding (high)

- **Icon.** A white vertical post with a red bar pushed out past it from a round red joint. It is distinct, reads at small sizes, and matches the limit line. This is the best brand asset.
- **Wordmark.** "THE MARK" is set in a plain grotesque, all caps, bold, with nothing borrowed from the icon. His rule is "Test the wordmark against the rendered asset" (2026-09-16). Next to the icon it looks like two separate systems.
- **OG image.** The strongest single frame here. The huge red **2.56%** is correctly the biggest thing. Two problems:
  - The caption uses an em dash ("share — and nothing tells you"), which his rule of 2026-09-15 bans.
  - It carries a timestamp and a live percentage, which break his rule "Nothing that can go stale on a static asset" (2026-09-17).

Taken together, these are a well-chosen icon beside a default typeface. They do not yet read as one brand.

## 5. The three biggest gaps

1. **(critical) The number is not the hero.** On home, the cost figure and the limit line should fill the first screen at both widths. Make it one huge dollar figure with the post-and-bar drawn full width under it, the bar crossing the limit and turning red, and let the headline shrink to a caption. The OG image already proves this layout works.
2. **(critical) Nothing here is made to be remembered.** The ceiling sites each have one rendered object that anchors the page. The limit line should become that object. Make it a real rendered object, modelled or sourced rather than built from primitives, that the scroll drives from "you keep" to "blocked". The founder already said "Scroll-driven motion of one object is the part that reads as impressive" (2026-09-19). The census slab should either become this object or be removed.
3. **(high) Typography with no voice.** Default grotesque headlines and grey lowercase monospace body prose, including "the gouge in it is the bite your order takes", make every page look like a terminal readout. The type needs a display face with character that belongs to the wordmark. Paragraphs should be cut to a line each. In his words: "we assume people are very technical and have the patience to read" (2026-09-15).

Smaller findings:
- (medium) The tSpaceX chip wraps onto a second row by itself.
- (medium) The census rows open on the best, empty result.
- (low) The background grid is barely visible and adds nothing.

## 6. Verdict

It is a clean, working pre-trade calculator in a dark card, with one real visual idea (the limit line) hidden 700 px down, and the founder would call it plain for the sixth time.