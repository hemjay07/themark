// Acceptance for design/PRD-V3.md, checks 1-11, in a real browser at 1440 and 390.
// Exits 0 only if every check passes at both widths. Usage: node scripts/check-v3.mjs http://localhost:3000
import { createRequire } from "node:module";
const require = createRequire(process.env.HOME + "/.claude/surface/package.json");
const { chromium } = require("playwright-core");

const base = process.argv[2] || "http://localhost:3000";
const WAIT = 13000;
const fails = [];
const check = (width, n, ok, what) => { if (!ok) fails.push(`${width} #${n} ${what}`); };

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
for (const width of [1440, 390]) {
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(WAIT);

  const s = await page.evaluate(() => {
    const txt = document.body.innerText;
    const top = (sel) => document.querySelector(sel)?.getBoundingClientRect().top ?? null;
    const rect = (sel) => document.querySelector(sel)?.getBoundingClientRect() ?? null;
    return {
      txt,
      refusal: !!document.querySelector("[data-refusal]"),
      action: [...document.querySelectorAll("button")].some((b) => /connect a wallet|place this order/i.test(b.innerText) && b.offsetParent !== null),
      advice: document.querySelector("[data-advice]")?.innerText ?? null,
      issuerTop: top("[data-issuer]"),
      keptTop: top("[data-kept]"),
      route: document.querySelector("[data-route]")?.innerText ?? null,
      nav: document.querySelector("nav")?.innerText ?? "",
      hero: rect("[data-hero]"),
      controls: rect("[data-controls]"),
      scrollW: document.documentElement.scrollWidth,
      gridCanvas: !!document.querySelector("canvas[data-device]"),
    };
  });

  check(width, 1, s.txt.includes("THE MARK shows what a tokenized stock really costs"), "no one-sentence description");
  check(width, 2, s.action && !s.refusal, "default order does not show the action button");
  check(width, 5, /Intel/.test(s.txt) && /S&P 500/.test(s.txt) && /Palantir/.test(s.txt), "company names missing");
  check(width, 6, /extra this order costs/i.test(s.txt) && /your limit/i.test(s.txt), "limit line unlabelled");
  check(width, 7, s.issuerTop !== null && s.keptTop !== null && s.issuerTop < s.keptTop, "issuer powers not above kept-vs-lost");
  check(width, 8, /Check an order/i.test(s.nav) && /Compare stocks/i.test(s.nav) && /Verify a trade/i.test(s.nav), "nav not renamed");
  check(width, 9, s.route !== null && !s.route.includes("%"), "routing is missing or still shows percentages");
  check(width, 10, width === 1440 ? (s.hero && s.controls && s.controls.left >= s.hero.right - 1) : s.scrollW <= width, width === 1440 ? "not two columns" : "horizontal scroll");
  check(width, 11, !s.gridCanvas, "background grid still present");

  // 3 and 4: drag to $25,000 and expect the block plus live advice
  await page.evaluate(() => {
    const r = document.querySelector('input[type="range"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(r, "25000");
    r.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(WAIT);
  const b = await page.evaluate(() => ({
    refusal: !!document.querySelector("[data-refusal]"),
    advice: document.querySelector("[data-advice]")?.innerText ?? null,
  }));
  check(width, 3, b.refusal, "$25,000 did not block");
  check(width, 4, b.advice !== null && /\$\d/.test(b.advice), "no advice with a live dollar figure when blocked");
}
await browser.close();

if (fails.length) { console.log("FAIL\n  " + fails.join("\n  ")); process.exit(1); }
console.log("PASS: PRD-V3 checks 1-11 at 1440 and 390");
