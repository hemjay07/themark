// Acceptance for design/ASSESS-3.md plan V3.1, in a real browser at 1440 and 390.
// Exits 0 only if every check holds at both widths. Usage: node scripts/check-v31.mjs http://localhost:3000
import { createRequire } from "node:module";
const require = createRequire(process.env.HOME + "/.claude/surface/package.json");
const { chromium } = require("playwright-core");

const base = process.argv[2] || "http://localhost:3000";
// the tool lives at /check since PRD-V4; the assertions are unchanged
const tool = process.argv[3] || "/check";
const fails = [];
const check = (w, n, ok, what) => { if (!ok) fails.push(`${w} #${n} ${what}`); };
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());

for (const width of [1440, 390]) {
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  await page.goto(base + tool, { waitUntil: "domcontentloaded", timeout: 45000 });
  // wait for the advice to finish its live checks (it can queue behind other reads on a 1 req/s key)
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1000);
    const ready = await page.evaluate(() => !!document.querySelector("[data-use-amount]"));
    if (ready) break;
  }
  const s = await page.evaluate(() => {
    const r = (sel) => document.querySelector(sel)?.getBoundingClientRect() ?? null;
    return {
      h1: document.querySelector("h1")?.innerText ?? "",
      refusal: !!document.querySelector("[data-refusal]"),
      seal: !!document.querySelector("[data-seal]"),
      useBtn: document.querySelector("[data-use-amount]")?.innerText ?? null,
      advice: r("[data-advice]"),
      controls: r("[data-controls]"),
      action: r("[data-action]"),
      legBar: r("[data-legend-bar]"),
      legLimit: r("[data-legend-limit]"),
      chipDots: [...document.querySelectorAll("[data-controls] button")].filter((b) => /…/.test(b.innerText)).length,
    };
  });
  // 1, 1b and 2 (the 'Use $X' button, one click to placeable, the phone order) described V3.1;
  // PRD-V5 replaces them with check-v5 #1 and #2 (the ticket, and 'Cut to $X')
  // 3. the two labels under the line do not overlap
  check(width, 3, s.legBar && s.legLimit && (s.legBar.right <= s.legLimit.left || s.legBar.bottom <= s.legLimit.top || s.legLimit.bottom <= s.legBar.top), "legend labels overlap");
  // 4. the block stamps the line (the headline lives on the story since PRD-V5)
  check(width, 4, s.seal, "BLOCKED seal missing");
  // 6. chips never show a bare ellipsis
  check(width, 6, s.chipDots === 0, `${s.chipDots} stock chips show "…"`);

  // 5. census: no 3D strip, never 24 silent empty rows, plain footnote
  await page.goto(base + "/census", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const c = await page.evaluate(() => ({
    canvas: !!document.querySelector("canvas"),
    txt: document.body.innerText,
  }));
  const values = (c.txt.match(/\d+\.\d\d%/g) || []).length;
  check(width, 5, !c.canvas && (values >= 12 || /taking the first reading/i.test(c.txt)) && !/api\.jup|lite-api|getQuote/i.test(c.txt),
    "census: 3D strip, silent empty rows, or an API name in the copy");
}
await browser.close();
if (fails.length) { console.log("FAIL\n  " + fails.join("\n  ")); process.exit(1); }
console.log("PASS: V3.1 checks at 1440 and 390");
