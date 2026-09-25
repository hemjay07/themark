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
    const ready = await page.evaluate(() => !!document.querySelector("[data-advice] [data-use-amount]"));
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
  // 1. opens on a blocked order, and the best advice carries a button
  check(width, 1, s.refusal && s.useBtn && /^Use \$/.test(s.useBtn.trim()), "does not open blocked with a 'Use $X' button");
  // 2. phone, as amended by ASSESS-5 (design/PRD-V3.md): what you set, then placing it, then the
  // alternatives, in that order, so the page reads input to outcome
  if (width === 390) check(width, 2, s.advice && s.controls && s.action && s.controls.top < s.action.top && s.action.top < s.advice.top, "phone order is not controls, action, advice");
  // 3. the two labels under the line do not overlap
  check(width, 3, s.legBar && s.legLimit && (s.legBar.right <= s.legLimit.left || s.legBar.bottom <= s.legLimit.top || s.legLimit.bottom <= s.legBar.top), "legend labels overlap");
  // 4. the name is used, and the block stamps the line
  check(width, 4, /don.t be the mark/i.test(s.h1) && s.seal, "headline or BLOCKED seal missing");
  // 6. chips never show a bare ellipsis
  check(width, 6, s.chipDots === 0, `${s.chipDots} stock chips show "…"`);

  // 1b. one click on the advice makes the order placeable
  if (s.useBtn) {
    await page.click("[data-use-amount]");
    let placeable = false;
    for (let i = 0; i < 25 && !placeable; i++) {
      await page.waitForTimeout(1000);
      placeable = await page.evaluate(() =>
        !document.querySelector("[data-refusal]") &&
        [...document.querySelectorAll("button")].some((b) => /connect a wallet|place this order/i.test(b.innerText)));
    }
    check(width, "1b", placeable, "'Use $X' did not make the order placeable");
  }

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
