# CONTEXT for Before you buy a tokenized stock, THE MARK shows what your exact order really costs, lets you set the worst fill you will take, then signs or refuses.
Assembled 2026-09-22T14:02Z by context.mjs. Read this before writing any route. Cite it: every colour,
face, radius, duration and technique in the build comes from a line here or from design/TOKENS.css, never from memory.

## The one moment (charter.wonder)
You drag the amount from 500 to 25,000 dollars and the cost meter counts from 0.75 to 2.80 percent in front of you, the pool being eaten as you watch, until the sign button turns into a refusal.
Hero technique: number-odometer · device: the fill-cost meter: the percentage this exact order pays over the price of the real share, quoted live from the route it would take (data)

## Tokens (design/TOKENS.css)
(missing)

## Faces
display: Archivo · text: Archivo · mono: JetBrains Mono
Fetch: node ~/.claude/surface/bin/fetch-part.mjs font "<Family>@400,700" [--from fontshare]

## Parts to compose from (3)
### number-odometer
# number-odometer

A currency figure that steps forward once a second, with only the digits that change animating,
rendered by @number-flow/react.

- Source: https://github.com/barvian/number-flow — the React wrapper's props read at
  `node_modules/@number-flow/react/dist/index.d.mts:18-35` (`value`, `format`, `locales`) and
  `:44-46` (`usePrefersReducedMotion`, `useCanAnimate`, which the element applies itself).
- Licence: MIT.
- When: reach for it when a figure changes while the reader is looking at it and the change is the point.
- Props: none on the part; the odometer takes `value` and a `format` of
  `{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }`.
- Measured (dpr 1, software GL, `--width 390,1280 --motion --budget-kb 3000`): no findings at either width. 1280: load 124 ms, frame p50 17 ms, p95 17 ms, longest task 60 ms. 390: load 136 ms, p50 17 ms, p95 17 ms, longest task 61 ms. 2087 KB transferred is the shared lab bundle, not this part's own cost. At 390 the figure starts at 30px and the three stats stay on one row, so nothing runs past the edge.
- Reduced motion: the interval is never started, the figure is printed once and left alone, and
  number-flow's own reduced-motion gate stops the digit animation as well (93 words in both poses).
cost: 2090 KB, p95 17 ms on the floor
```jsx
function NumberOdometer() {
  const reduced = useReducedMotion();
  const root = useRef(null);
  const inView = useInView(root);
  const [value, setValue] = useState(ODO_BASE);
  useEffect(() => {
    if (reduced || !inView) return;
    const id = setInterval(() => setValue((v) => v + ODO_RATE), 1000);
    return () => clearInterval(id);
  }, [reduced, inView]);
  return (
    <main className="pg wrap" ref={root} data-device="number-odometer">
      <Style>{BASE_CSS + `
        .odo{font:400 clamp(30px,8vw,104px)/1 var(--font-mono);letter-spacing:-.03em;margin:32px 0 8px;display:block;--number-flow-char-height:.85em}
        .odo-screen{min-height:100vh;padding-bottom:12vh;display:grid;align-content:start}
        .odo-row{display:flex;gap:64px;flex-wrap:wrap;margin:56px 0 44px}
        .odo-row div{min-width:180px}
        .odo-row b{display:block;font:400 28px/1 var(--font-mono);color:var(--ink);margin-bottom:8px}
        .odo-row span{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2)}
        @media (max-width:600px){
          .odo-row{gap:14px;margin:28px 0 24px;flex-wrap:nowrap}
          .odo-row div{min-width:0;flex:1}
          .odo-row b{font-size:19px;margin-bottom:6px}
          .odo-row span{font-size:9px;letter-spacing:.1em}
        }
      `}</Style>
      <div className="odo-screen">
      <p className="kicker">Counter · LEDGE</p>
      <h1>Graduated liquidity, counted forward</h1>
      <NumberFlow
        className="odo"
        value={value}
        format={{ style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 2 }}
      />
      <p className="lede">The figure moves at 37.18 dollars a second, the mean rate of the last twenty-four hours (n=41 graduations). It is a projection from that mean, not a reading: the true figure lands when the next crawl does.</p>
      <div className="odo-row">
        <div><b>4,124</b><span>graduations</span></div>
        <div><b>1.56%</b><span>of all launches</span></div>
        <div><b>3 min</b><span>median time</span></div>
      </div>
      </div>
      <p>Only the digits that change are animated, and the element stops counting when it scrolls out of view. Under a reduced-motion preference the figure is printed once and left alone.</p>
    </main>
  );
}
```

### hairline-grid
# hairline-grid

A document page with no boxes: three tokenised rule weights (hair 1px, mid 3px, heavy 7px)
carry every division, and the layout is a 12-column grid whose column width is derived from
`--columns`, `--gap` and `--safe` rather than written down. Press **G** (or the button) for a
fixed overlay that paints the twelve columns and the 26px baseline.

- Sources:
  - Column debugger — reading `--columns` off the document element and rendering one `<span>`
    per column inside a fixed, pointer-transparent layer:
    `_src/satus/lib/dev/grid/index.tsx:10-31`; the tinted-span styling at
    `_src/satus/lib/dev/grid/grid.module.css:1-13`.
  - Derived column width (`--layout-width`, `--column-width` computed from columns/gap/safe,
    4 columns on mobile and 12 on desktop): `_src/satus/lib/styles/css/root.css:11-34`.
  - Three rule weights as tokens and the `.rule-hair` / `.rule-mid` / `.rule-heavy` classes:
    `/Users/mujeeb/ledge/site/app/globals.css:34-36` and `:218-227`.
- Licence: satus MIT (`_src/satus/LICENSE`); LEDGE is this operator's own repo.

When to use it: any document-shaped surface where a card would add four edges to say what a
single rule already says.

Props: `columns` (12), `gap` (16px), `safe` (40px), `baseline` (26px — also the body
line-height, so paragraphs in all three columns land on the same lines).

Measured: `measure.mjs --width 1280 --motion --dpr 1 --budget-kb 3000` → findings [], pass true.
No animations, no canvas; the overlay is mounted only while it is on.

Reduced motion: nothing moves in either state. The only transition is a 150 ms border-colour
change on the button's hover, which no reader depends on.

## Phone pass (390)

Re-measured with `--width 390,1280 --motion --dpr 1 --budget-kb 3000`: findings [] at both
widths, pass true. Frame time p50 17 ms / p95 17 ms at 390 and at 1280 (1/283 dropped frames at 390,
1/296 at 1280). At 390 the grid drops from 12 columns to satus's 4, every prose block spans `1/-1`, the figures go two-up, and the masthead band takes `min-height:100vh`.
cost: 2090 KB, p95 17 ms on the floor
```jsx
function HairlineGrid({ columns = 12, gap = 16, safe = 40, baseline = 26 }) {
  const [grid, setGrid] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "g" || e.key === "G") setGrid((v) => !v); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const vars = {
    "--columns": columns,
    "--gap": `${gap}px`,
    "--safe": `${safe}px`,
    "--baseline": `${baseline}px`,
  };

  return (
    <main className="hg-page" style={vars} data-device="hairline-grid" data-grid={grid ? "on" : "off"}>
      <style>{`
.hg-page{--rw-hair:1px;--rw-mid:3px;--rw-heavy:7px;position:relative;min-height:100vh;padding:var(--safe);
  display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));column-gap:var(--gap);row-gap:0;align-content:start}
.hg-rule{grid-column:1/-1;background:var(--hairline)}
.hg-rule[data-w="hair"]{height:var(--rw-hair)}
.hg-rule[data-w="mid"]{height:var(--rw-mid);background:var(--ink-2)}
.hg-rule[data-w="heavy"]{height:var(--rw-heavy);background:var(--ink)}
.hg-band{grid-column:1/-1;display:grid;grid-template-columns:subgrid;padding:calc(var(--baseline)*0.75) 0}
.hg-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-2);margin:0}
.hg-h1{grid-column:1/9;font:400 clamp(30px,4.2vw,50px)/1.06 var(--font-display);margin:0}
.hg-meta{grid-column:10/-1;display:flex;flex-direction:column;gap:6px;align-items:flex-end;text-align:right}
.hg-a{grid-column:1/6}
.hg-b{grid-column:6/10}
.hg-c{grid-column:10/-1}
.hg-band p{margin:0 0 calc(var(--baseline)*0.6);font-size:14px;line-height:var(--baseline);color:var(--ink)}
.hg-band p:last-child{margin-bottom:0}
.hg-band p.hg-dim{color:var(--ink-2)}
.hg-label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2);margin:0 0 10px}
.hg-figs{grid-column:1/-1;display:grid;grid-template-columns:subgrid}
.hg-fig{grid-column:span 3;border-left:var(--rw-hair) solid var(--hairline);padding-left:12px}
.hg-fig b{display:block;font:400 30px/1 var(--font-display);margin-bottom:6px}
.hg-fig span{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-2)}
.hg-controls{grid-column:1/-1;display:flex;gap:16px;align-items:center;padding-top:14px;font-size:12px;color:var(--ink-2)}
.hg-controls button{font:12px/1 var(--font-mono);background:transparent;color:var(--ink);border:var(--rw-hair) solid var(--hairline);padding:8px 12px;cursor:pointer;transition:border-color 150ms cubic-bezier(0,0,.2,1)}
.hg-controls button:hover{border-color:var(--ink-2)}
.hg-overlay{position:fixed;inset:0;pointer-events:none;z-index:60;padding:0 var(--safe);
  display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));column-gap:var(--gap)}
.hg-overlay span{background:var(--signal);opacity:.07}
.hg-overlay::before{content:"";position:absolute;inset:0;
  background-image:repeating-linear-gradient(to bottom,var(--hairline) 0 1px,transparent 1px var(--baseline))}
@media (max-width:700px){
  .hg-page{grid-template-columns:repeat(4,minmax(0,1fr));padding:20px 16px 96px}
  .hg-overlay{padding:0 16px}
  .hg-masthead{min-height:100vh;align-content:start;padding-bottom:112px}
  .hg-h1,.hg-meta,.hg-a,.hg-b,.hg-c{grid-column:1/-1}
  .hg-meta{align-items:flex-start;text-align:left;margin-top:14px}
  .hg-band{row-gap:26px}
  .hg-fig{grid-column:span 2}
  .hg-controls{flex-wrap:wrap;gap:12px}
}
```

### mono-address
# mono-address

Addresses and 32-byte hashes set in the mono face, chunked in fours, never truncated, copied
in full on click. The trust state is printed by the stylesheet from a data attribute, so the
content cannot spoof it away: `[data-verified="false"] .ma-name::before { content: "UNVERIFIED · " }`.

- Sources: leekwallet (ETHOnline 2026 finalist), torn into this kit at
  `~/.claude/surface/refs/leekwallet/STEAL.md:7-8`, which cites the original repo
  https://github.com/0xOucan/LeekWallet —
  - `app/src/styles.css:281` — mono for addresses as a security property: "proportional fonts
    make l/1 and 0/O ambiguous"; hashes in mono, chunked in 4s, never truncated.
  - `app/src/styles.css:411` — `.unverified-desc .kv dt::before { content: "UNVERIFIED · " }`:
    a warning the content cannot spoof away, injected by CSS from a data attribute rather than
    written into the copy.
  - The "colour is never the only carrier" constraint on that warning:
    `~/.claude/surface/principles.md` (Sara Soueidan). The prefix is a word, and the hue only
    reinforces it.
- Licence: LeekWallet MIT.

When to use it: anywhere a reader is expected to check a hash or an address before trusting it.

Props: `rows` — `[{ name, addr, verified, note }]`. The third demo row is an attacker's name
containing the word "Verified", to show the stylesheet prefix winning over the content.

Measured: `measure.mjs --width 1280 --motion --dpr 1 --budget-kb 3000` → findings [], pass true.
Frame time p50 17 ms, p95 17 ms; no animations. Copy verified by hand in Chromium: clicking the
first row put `0x7A1fD3c9B04e58aA2c6E91Df4b0aC7135E92Dc48` (unbroken, no chunk spaces) on the
clipboard and the live region read "copied in full". When the Clipboard API is refused the part
falls back to a selection copy and says so in the same live region.

Reduced motion: nothing animates in either state; word count is identical.

## Phone pass (390)

Re-measured with `--width 390,1280 --motion --dpr 1 --budget-kb 3000`: findings [] at both
widths, pass true. Frame time p50 17 ms / p95 17 ms at 390 and at 1280 (1/284 dropped frames at 390,
1/301 at 1280). At 390 the two-column body stacks, the row footer goes vertical, and the masthead takes `min-height:100vh`.
cost: 2090 KB, p95 17 ms on the floor
```jsx
function MonoAddress({ rows = MA_ROWS }) {
  const [copied, setCopied] = React.useState("");
  const timer = React.useRef(0);

  const copy = async (addr) => {
    let ok = false;
    try { await navigator.clipboard.writeText(addr); ok = true; } catch (e) { ok = false; }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = addr; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
    }
    setCopied(ok ? addr : `fail:${addr}`);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(""), 1600);
  };

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <main className="ma-page">
      <style>{`
.ma-page{min-height:100vh;padding:40px 40px 72px;display:flex;flex-direction:column;gap:22px}
.ma-head{display:flex;justify-content:space-between;align-items:baseline;gap:24px;border-bottom:1px solid var(--hairline);padding-bottom:12px}
.ma-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-2);margin:0}
.ma-h1{font:400 clamp(26px,3.4vw,42px)/1.06 var(--font-display);margin:8px 0 0}
.ma-body{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:44px;align-items:start}
.ma-list{display:flex;flex-direction:column;gap:0}
.ma-item{border-bottom:1px solid var(--hairline);padding:14px 0}
.ma-item:first-child{border-top:1px solid var(--hairline)}
.ma-name{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2);margin:0 0 8px}
.ma-item[data-verified="false"] .ma-name::before{content:"UNVERIFIED · ";color:var(--signal);letter-spacing:.14em}
.ma-item[data-verified="true"] .ma-name::before{content:"VERIFIED · ";color:var(--ink-2);letter-spacing:.14em}
.ma-copy{display:block;width:100%;text-align:left;background:transparent;border:0;padding:0;cursor:copy;
  font-family:var(--font-mono);font-size:15px;line-height:1.5;color:var(--ink);letter-spacing:.02em}
.ma-copy:focus-visible{outline:2px solid var(--signal);outline-offset:3px}
.ma-copy span{display:inline-block;margin-right:.55ch}
.ma-foot{display:flex;justify-content:space-between;gap:16px;margin-top:8px;font-size:11.5px;color:var(--ink-2)}
.ma-note{font-size:13px;line-height:1.62;color:var(--ink-2);margin:0 0 14px;max-width:48ch}
.ma-note b{color:var(--ink);font-weight:400}
.ma-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.ma-live{min-height:1.2em;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--signal)}
@media (max-width:700px){
  .ma-page{padding:22px 16px 96px;gap:26px}
  .ma-head{display:block;min-height:100vh;padding-bottom:112px;border-bottom:0}
  .ma-head>p.ma-kicker:last-child{margin-top:14px}
  .ma-body{display:block}
  .ma-note{max-width:none;font-size:14px}
  .ma-list{margin-bottom:26px}
  .ma-copy{font-size:14px}
  .ma-foot{flex-direction:column;gap:4px}
  .ma-foot span:last-child{color:var(--ink-2)}
}
```

## References (3), each with its numbers
### owid-grapher: take colour only on the data and chrome achromatic; radius 2px on 275 elements; two shadows total, one a 1px inset ring, so edges are hairlines not elevation
hues 4, signal C 0.203, ground L 1, ink L 0.471, radius 100px, shadows 2, easings 2, longest 300 ms, display 25px, above the fold 978, 6118 KB
/* owid-grapher: values read from computed styles at 1280; :root vars copied where readable */
/* measured */
/* ground rgb(255, 255, 255) (L 1); ink rgb(91, 91, 91) (L 0.471) */
/* signal rgb(206, 38, 30) oklch(0.551 0.203 29); hue buckets 30,90,240,270 */
/* backgrounds by count: rgb(255, 255, 255) x555; rgb(235, 238, 242) x299; rgb(164, 182, 202) x13; rgb(219, 229, 240) x6; rgb(242, 242, 242) x6; rgb(240, 244, 250) x6; rgb(0, 33, 71) x4; rgb(206, 38, 30) x2 */
/* inks by count: rgb(91, 91, 91) x307; rgb(118, 118, 118) x283; rgb(66, 101, 145) x85; rgb(29, 61, 99) x74; rgb(255, 255, 255) x22; rgb(87, 114, 145) x17; rgb(17, 46, 79) x12; rgb(152, 169, 189) x11 */
/* borders by count: rgb(242, 242, 242) x272; rgb(218, 218, 218) x260; rgb(219, 229, 240) x17; rgb(164, 182, 202) x13; rgba(0, 0, 0, 0) x10; rgb(208, 218, 227) x9; rgb(231, 231, 231) x3; rgb(255, 255, 255) x2; hairline alpha 1 */
/* fonts: Lato x782; Playfair Display x21; Menlo x19; body weight 400 */
value | where | for them | for the project at hand
signal `rgb(206,38,30)` on a white ground, chart series in 4 hue buckets | TOKENS.css "signal" | colour only on data lines; chrome is grey | a chart's hues are data; the page's chrome stays achromatic
radius 2 px on 275 elements, 4 px on 19 | TOKENS.css "radii" | one small radius, the instrument look | one radius token
two shadows total, one is a 1 px inset ring | TOKENS.css "shadows" | edges by hairline, not by elevation | depth level 0: rings and hairlines, no drop shadows
sources and notes printed under every chart | 1280.png | the chart carries its provenance | n and source on every figure (LEDGE CONSTRAINTS; FOUNDER 2026-09-15)
longest transition 300 ms, easings ease-out and (0.23,1,0.32,1) | MOTION.md | motion at data speed | MOTION-RULES 2: cap under a third of a second for chrome
shots: /Users/mujeeb/.claude/surface/refs/owid-grapher/1280.png, /Users/mujeeb/.claude/surface/refs/owid-grapher/390.png

### onchainrouter: take every number is read live at request time or it is not shown (force-dynamic on the landing); one named transition token, --ease 160ms, not twelve literals
hues 3, signal C 0.174, ground L 0.191, ink L 0.65, radius 50px, shadows 1, easings 2, longest 560 ms, display 64px, above the fold 89, 661 KB
/* onchainrouter: values read from computed styles at 1280; :root vars copied where readable */
/* measured */
/* ground rgb(20, 20, 20) (L 0.191); ink lab(59.4 0 0) (L 0.65) */
/* signal rgb(210, 80, 32) oklch(0.599 0.174 39); hue buckets 30,90,150 */
/* backgrounds by count: rgb(42, 42, 42) x14; rgb(34, 34, 34) x5; rgb(210, 80, 32) x3; rgb(20, 20, 20) x3 */
/* inks by count: lab(59.4 0 0) x49; lab(94.2 0 0) x47; lab(45.48 0 0) x29; rgb(210, 80, 32) x9; rgb(255, 255, 255) x3; lab(69.5705 -47.7195 39.7963) x2; rgb(240, 180, 41) x1 */
/* borders by count: rgba(255, 255, 255, 0.1) x31; rgb(210, 80, 32) x7; rgba(255, 255, 255, 0.16) x4; rgb(201, 74, 28) x2; hairline alpha 0.1 */
/* fonts: Inter x87; ui-monospace x53; body weight 400 */
value | file:line | for them | for the project at hand
`--bg: #141414`, `--ease: 160ms ease` | app/globals.css:11, :33 | one ground, one transition token | a single named transition beats twelve literals
`export const dynamic = "force-dynamic"` on the landing | app/page.tsx:16 | every landing number is read live; a missing env can never render "0 rails live" | numbers on a surface come from data at request time or not at all
`transition-delay: 120ms, 120ms, 0s, 0s` on multi-property transitions | app/globals.css:910 | enter properties staggered, exit properties immediate | asymmetric in/out timing; exits never lag
draw-in `to { transform: scaleX(1) }` for a line that means a flow | app/globals.css:555 | a line draws because a route exists | diegetic motion: the transition renders a data event
accordion by `grid-template-rows: 0fr -> 1fr` | app/globals.css:2234 | height animation without JS measurement | prefer CSS grid rows over max-height hacks
shots: /Users/mujeeb/.claude/surface/refs/onchainrouter/1280.png, /Users/mujeeb/.claude/surface/refs/onchainrouter/390.png

### gmgn: take a tool surface earns density: 591 elements above the fold at 1280, display 16px, no headline at all; the audience is a trader who reads that without complaint
hues 7, signal C 0.213, ground L 0.182, ink L 0.6, radius 24px, shadows 1, easings 3, longest 300 ms, display 16px, above the fold 481, 26595 KB
/* gmgn: values read from computed styles at 1280; :root vars copied where readable */
/* measured */
/* ground rgb(18, 18, 18) (L 0.182); ink rgb(128, 128, 128) (L 0.6) */
/* signal rgb(152, 105, 255) oklch(0.643 0.213 294); hue buckets 30,60,90,120,150,210,300 */
/* backgrounds by count: rgb(31, 31, 31) x14; rgb(36, 36, 36) x9; rgb(18, 18, 18) x8; rgb(10, 10, 10) x6; rgb(128, 128, 128) x2; rgb(105, 207, 141) x1; rgb(46, 46, 46) x1; rgb(222, 87, 89) x1 */
/* inks by count: rgb(128, 128, 128) x67; rgb(245, 245, 245) x28; rgba(0, 0, 0, 0) x9; rgb(105, 207, 141) x7; rgb(26, 26, 26) x3; rgb(248, 185, 81) x3; rgb(204, 204, 204) x3; rgb(70, 203, 240) x2 */
/* borders by count: rgba(0, 0, 0, 0) x15; rgb(36, 36, 36) x9; rgb(51, 51, 51) x4; rgb(31, 31, 31) x2; rgb(243, 243, 243) x1; rgb(110, 114, 125) x1; hairline alpha 0 */
/* fonts: Geist x70; gmgn-core-icons x57; body weight 400 */
value | where | for them | for the project at hand
ground `rgb(18,18,18)` L 0.182; 5 hue buckets incl. purple signal oklch(0.643 0.213 294) | TOKENS.css | a trader terminal: many states, many colours | this is the audience's baseline; a crypto surface that wants to read as "serious" must be denser than a landing page but can drop to 1-2 hues
591 elements above the fold at 1280, 161 at 390 | TOKENS.css "above the fold" | density is the product | density axis: the audience is used to ~600; a 20-element fold reads as empty to them
display 16 px at 1280 (no headline at all) | TOKENS.css "display" | a tool, not a page | a tool surface can have no headline; the charter says which routes are tools
radii 4/6/7/8 px; one shadow; Geist | TOKENS.css | small radii, flat | flat and small is the terminal look
easing `cubic-bezier(0.4,0,0.2,1)` x37, longest 300 ms | MOTION.md | material-style standard curve, nothing over 300 ms | the audience expects instant; anything slower than 300 ms reads as decoration
shots: /Users/mujeeb/.claude/surface/refs/gmgn/1280.png, /Users/mujeeb/.claude/surface/refs/gmgn/390.png

## Bans, each with its number (a Ruler finding when 3+ fire; the charter's own are findings on their own)
- default-display-face
- purple-gradient
- gradients (>=3)
- gradient-text
- three-feature-cards
- rounded-everything (>60% of boxes >=16px)
- shadow-everything (>40% of boxes)
- glassmorphism (>=2)
- uniform-entrance (>=5 share one animation)
- emoji-icons (>=3)
- stock-copy (>=2 phrases)
- centred-hero-two-buttons
- icon-in-circle (>=4)
- too-many-hues (>3 buckets)
- accent-everywhere (>9 moments)
- one-default-face
- CHARTER: no figure on the surface that was not returned by a call made in that moment: no sample data, no placeholder price, no remembered number
- CHARTER: no chart of the gap between the token and the share: it is 0.20% median and fourteen other teams in this hackathon are drawing it
- CHARTER: no green arrow, no confetti, no celebration of a trade: the product's whole claim is that it tells you the cost

## Copy
# VOICE.md (copy rules for the founder)

The founder's voice rules, extracted from FOUNDER.jsonl and POSTMORTEM.md §4.
Read these before drafting any copy for a surface.

## Ten rules

1. **Voice is tape, not narrative.** No em-dash label pairs, no semicolons for lists, no performed feeling. A line parses on first read.
   - Wrong: "command — gloss; option — explanation"
   - Right: "type /command. it shows your balance."

2. **Never manufacture feeling.** Avoid phrases that read as fake or AI-like.
   - Wrong: "the number that surprised me"
   - Right: "1 in 150 graduated"

3. **The subject is the headline.** The event or the thing, not the date or the rate.
   - Wrong: "September 19" or "4.5%"
   - Right: "Grid launched" or "Lizard token"

4. **Names, not hashes.** Show human-readable identifiers.
   - Wrong: "0x742d35Cc6634C0532925a3b844Bc4e7595f42bF"
   - Right: "Lizard"

5. **Short by default.** If the founder asks for more, give it; otherwise assume every line is one sentence and every page is one screen.
   - Wrong: "The platform which serves as a launchpad for innovative projects..."
   - Right: "Launches on Pons."

6. **Value first, then background.** Descriptions open with what it does, not its story.
   - Wrong: "Created in 2026 to solve the problem of..."
   - Right: "Tracks launch outcomes. 4.5% graduate in 5+ minutes."

7. **One example sentence in the sender's voice before drafting.** Show the founder one line in their tone; get approval before the full draft.
   - Step: "Sender's voice would be: 'Lizard hit 5K holders.'"
   - Then: Draft the full reply

8. **Terminal register for data.** No adjectives on numbers; no hedging.
   - Wrong: "Impressive 1,847 launches"
   - Right: "1,847 launches"

9. **Replace every instance on the first rewrite.** Do not let the same error recur.
   - First pass: Find all instances of the problem
   - Rewrite: Fix all of them in one pass

10. **Platform field rules.** Check the character limit, format rules, and image requirements before drafting.
    - Read the platform's specs (X post length, form field max, image ratio)
    - Confirm compliance before sending

## Ambition floor (Ruler --floor)
- the display face is not a default (Inter, Roboto, Arial, system)
- 1 to 3 motion moments that render a data or state change; never 0, never one on every section
- accent moments <= 9 (3 colours x 3 appearances)
- one [data-device] element on the surface: the thing that could only exist for this product
- one hero technique, from the parts bin, named in the charter

## Missing before building
- design/TOKENS.css (run spec.mjs on the surviving prototype, or write it from the charter's faces and signal colours)
