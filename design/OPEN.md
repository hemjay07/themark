# OPEN items (read at session start; one line each, dated)
A/B prototypes: Pass, live Jupiter calls working, no CORS issues detected 2026-09-22T14:08Z
2026-09-22 14:35Z conductor: A/B decided by the conductor, not the judge, on a correctness ground: both
prototypes stated "this order pays X% over the share" while the token traded 1.36% BELOW the share, so the
central claim was false in both. A kept for structure (meter as hero, claim as headline); B cut (headline
instructs, number buried in a list). The judge still gives the concept verdict on the corrected A.
2026-09-22 14:35Z conductor: the honest model is three numbers, not one: fill cost (always a cost), basis
(direction stated in words), net against the share (the headline). Plus the mint multiplier, which every other
cost calculator in this category ignores (research/MULTIPLIER-FINDING.md).
2026-09-22 15:00Z conductor: fold stopped at v4 after the round cap (one aesthetic round on the judge's axis,
one defect round on its geometry). State: honest, zero findings at both widths, the axis full width with the
bar and its caption. Not yet arresting. Two things to fix inside the real app, where the interaction is real:
the axis sits in a full-bleed black band that reads as an inserted panel rather than part of the card, and it
carries large dead space above and below. The memorable moment is the crossover at $7,780, which a still cannot
show and the demo video can.
2026-09-22 15:40Z conductor: two kit findings from this fold, to fix after the hackathon.
1. measure.mjs will happily measure whatever answers on the URL. A stray `next dev` on the project's serve port
   made it report "no [data-device] element" and a 337 KB page for a prototype that has both. The instrument
   should assert it measured the page it was asked for (a title or a marker element) and say so in the output.
2. The Ruler's overlap rule compares text rectangles, so a graphic drawn over text is invisible to it: the axis
   bar was drawn straight through the price label for two rounds and every run passed with zero findings.
   A [data-device] graphic that intersects a text rect should be a finding.
3. An SVG scaled to its container makes every font-size in the viewBox a lie: a "26px" label rendered at 13px
   and three judge rounds were spent on a prescription that had in fact not been executed. The parts bin should
   carry this as a gotcha on any svg-based device.
