# THE MARK: design craft and brand assessment

I read the founder's rules in `~/.claude/surface/FOUNDER.jsonl`, all 14 PNGs in `/Users/mujeeb/themark/design/shots/assess3/`, and `/Users/mujeeb/themark/design/shots/og-live2.png`. For comparison I used three references: `refs/tare`, `refs/novi-corpus` and `refs/_ceiling/basement`.

## 1. Tier today

The site sits at the lower edge of the floor shelf of hackathon winners. It is below tare and does not come close to the ceiling.

- **Against tare:** both use a dark background, a mono font and one big number. Tare's fold also has a heading of about 80px in all capitals, a button in its accent colour, four example chips you can click, and a diagram of how the system works right under the fold. The Mark's fold has one number and a form, and nothing else is happening on the page.
- **Against novi-corpus:** novi has a headline that reads like a claim and a tilted product mockup. The Mark has no claim as a headline and no object on the page.
- **Against the ceiling (basement):** basement's page is a whole world. The Mark does not attempt anything like that.

The founder's rule of 2026-09-19 decides this: "clean, correct and plain is not memorable." These pages are clean, correct and plain. **Critical.**

## 2. What a stranger learns in three seconds

**Home at 1440.** The biggest thing is "$4.08" in white. A stranger learns that some order costs $4.08. On $2,000 that is 0.2%, so the conclusion is "this is cheap, nothing to worry about." That is the wrong conclusion for a product that exists to warn. The opening line is a three-line grey paragraph that starts with the product name. Under the 2026-09-19 rule, "Descriptions open with the value," it should open with the value. **High.**

**Home at 390.** The same conclusion as desktop. The legend collides into "EXTRA THIS ORDER COSTSYOUR LIMIT 1.00%", with no gap between the two labels. That breaks the 2026-09-18 rule, "nothing clipped." Most stock chips show "…" where the percentage should be, on desktop and on phone. **High.**

**Compare stocks (census) at both widths.** Every row says "reading…", and all 24 bars are empty grey. The stranger concludes the page is broken or still loading. The 3D strip at the top is a murky green and grey slab that cannot be read. It is the same failure as the "grey three.js slab" the founder rejected on 2026-09-19. The footnote exposes "lite-api.jup.ag/swap/v1/quote", which is the indexer vocabulary rule 8 bans. **Critical.**

**Verify a trade (proof).** The page shows a big green "$0.16", labelled "came in under the real share by." The stranger concludes the trade was fine. That is correct, but it is the least dramatic result the page can show. The first thing on the page is a raw 88-character transaction hash, which goes against "Names, not hashes." The permissions matrix below is the strongest thing on the site, but it sits at scroll depth 1100px or more. **Medium.**

**The social card.** "$496" in red, with "1.98% gone before you own a share." This is the best asset in the set: a subject, a loss and a stake. It uses a different font from the site's mono numerals. **Low.**

## 3. The blocked state: a guard or a wall?

**At 1440 it mostly reads as a guard.**
- The number turns red.
- The red bar runs past the limit mark.
- The wallet button is replaced by a red "BLOCKED" box.
- "What you can do instead" offers a split into three orders at "$185 less."

The helpful part is too small. The $185 saving is set in body text, while the $314.28 loss is set at 110px. The split has no button, so the only control in that position is gone. "checking other ways to buy this, live…" is still a loading string when the screenshot was taken.

**At 390 it reads as a wall, or as nothing at all.** The phone fold shows the number turning red, but neither the BLOCKED box nor the alternative. A phone user sees a red number and has to scroll to find out why it matters. **High.**

## 4. Identity

The lockup is a small red bracket glyph, then "THE MARK" in a default-looking grotesk, with a thin red underline. At 20px the glyph cannot be read. The founder's 2026-09-16 check ("does the logo read at size?") fails.

- **Colour:** near-black with one red and one green. That is the default palette for a dark crypto dashboard.
- **Type:** a grotesk plus a mono, with wide-tracked small capitals for labels. That is tare's type system, with less weight.
- **Name:** "The mark" has a second meaning available: marked price, marking to market, being the mark in a con. Nothing on the page uses it. Rule 14 asks for "a repeatable phrase with a second meaning."

Verdict: this reads as a styled default, not a brand. **High.**

## 5. The five biggest gaps, ranked

1. **The home page opens on a harmless number (critical).** Load the default at a painful order, $25,000 of OpenAI as on the social card, so the first screen shows a red loss and the block. Then make the headline a claim that uses the name. One example: "Don't be the mark: $496 gone before you own a share." At present the fold persuades no one.

2. **Compare stocks shows empty bars at first paint (critical).** Render the last stored reading at once, dated, and let the live reading replace it. Sort worst first so the longest red bar sits at the top. Remove the 3D slab, or replace it with a sourced model that shows something, such as a token and a share on a scale. The founder's 2026-09-19 note: "the device comes from a real model." Move the API footnote behind a disclosure.

3. **There is no signature object or motion (high).** Every surface is text on flat panels. Give the cost bar the role that the scroll rig played in the earlier project the founder praised. As the order size grows, the gap between token and share should open physically, and a red wedge should cross the limit line with a stamped "MARKED" or "BLOCKED" seal. The founder called scroll-driven motion of one object "the part that reads as impressive."

4. **The saving is smaller than the loss (high).** In the blocked state, set "$185 less" at the same scale as the loss, beside it, in green, with a "split it for me" button where the wallet button was. On phone, put BLOCKED and the alternative directly under the number, inside the fold. Fix the colliding legend.

5. **The issuer powers are buried, and the lockup cannot be read (medium).**
   - On home, turn the four red-rule sentences into four icon badges for the chosen token, next to the number.
   - On proof, move the permissions matrix to the top, and make the example trade a bad one rather than $0.16 in the user's favour.
   - Redraw the glyph as a real mark: for example, a tick crossing a line, sized at 28px or more.
   - Use one numeral font across the site and the social card.

## 6. Verdict

The Mark is honest and correct, but on its first screen it tells a stranger their order costs "$4.08, fine." Its compare page loads empty. It has no object, motion or brand that anyone would remember, so today it is a competent floor-tier entry, not a winning one.