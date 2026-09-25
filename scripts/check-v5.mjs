// Acceptance for design/PRD-V5-ONE-INSTRUMENT.md, in a real browser at 1440 and 390.
// Usage: node scripts/check-v5.mjs http://localhost:3000
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const base = process.argv[2] || "http://localhost:3000";
const DEMO_WALLET = "6CtLg5reXUya6bdxG14iHzYFxeJw2FAhm2evq93TTyBH";
const fails = [];
const check = (w, n, ok, what) => { if (!ok) fails.push(`${w} #${n} ${what}`); };
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());

for (const width of [1440, 390]) {
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();

  // 1, 2, 3, 7: the ticket is the app
  await page.goto(base + "/check", { waitUntil: "domcontentloaded", timeout: 45000 });
  for (let i = 0; i < 45; i++) {
    await page.waitForTimeout(1000);
    if (await page.evaluate(() => !!document.querySelector("[data-ticket] [data-use-amount]"))) break;
  }
  const t = await page.evaluate(() => {
    const tk = document.querySelector("[data-ticket]");
    const q = (sel) => !!tk?.querySelector(sel);
    return {
      ticket: !!tk,
      parts: q("[data-controls]") && q("#tc-amt") && q(".ll-edit input") && q(".tk-cost") && q("[data-legend-limit]") && q("[data-seal]") && q(".tk-foot"),
      h1: document.querySelectorAll("h1").length,
      cut: tk?.querySelector("[data-use-amount]")?.innerText?.trim() ?? null,
      refusal: q("[data-refusal]"),
      scrollW: document.documentElement.scrollWidth,
    };
  });
  check(width, 1, t.ticket && t.parts && t.h1 === 0, "the ticket is missing a part, or the page has a headline");
  check(width, 2, t.refusal && t.cut && /^Cut to \$/.test(t.cut), `no 'Cut to $X' on a blocked ticket (got ${JSON.stringify(t.cut)})`);
  check(width, 7, t.scrollW <= width, "/check scrolls horizontally");
  if (t.cut) {
    await page.click("[data-ticket] [data-use-amount]");
    let clears = false;
    for (let i = 0; i < 25 && !clears; i++) {
      await page.waitForTimeout(1000);
      clears = await page.evaluate(() => !document.querySelector("[data-refusal]") && /CLEARS/.test(document.querySelector("[data-ticket] .tk-stamp")?.textContent ?? "") && [...document.querySelectorAll("[data-ticket] button")].some((b) => /connect a wallet|place this order/i.test(b.innerText)));
    }
    check(width, 2, clears, "the cut did not make the ticket clear with an order button");
  }
  let stubs = 0;
  for (let i = 0; i < 20 && stubs < 1; i++) {
    await page.waitForTimeout(1000);
    stubs = await page.evaluate(() => [...document.querySelectorAll("[data-stub]")].filter((s) => /\$\d/.test(s.innerText)).length);
  }
  check(width, 3, stubs >= 1, "no stub with a live dollar figure");
  const appNav = await page.evaluate(() => document.querySelector("nav")?.innerText ?? "");
  check(width, 4, /check/i.test(appNav) && /compare/i.test(appNav) && /verify/i.test(appNav) && !/launch app/i.test(appNav), "app nav is not Check, Compare, Verify");

  // 4: the story's nav and sentence
  await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  const st = await page.evaluate(() => ({
    nav: document.querySelector("nav")?.innerText ?? "",
    launch: [...document.querySelectorAll("nav a")].some((a) => /launch app/i.test(a.innerText) && a.getAttribute("href") === "/check"),
    lede: /THE MARK shows what a tokenized stock really costs/.test(document.body.innerText),
    scrollW: document.documentElement.scrollWidth,
  }));
  check(width, 4, (width === 390 || st.launch) && !/check an order/i.test(st.nav) && st.lede, "story nav lists 'Check an order', lacks Launch app, or lost the sentence");
  check(width, 7, st.scrollW <= width, "/ scrolls horizontally");

  // 5: the field against the line
  await page.goto(base + "/census", { waitUntil: "domcontentloaded", timeout: 45000 });
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1000);
    // priced cells, not the placeholders drawn while the reading is on its way
    if (await page.evaluate(() => document.querySelectorAll("[data-cell]:not(.gap)").length >= 12 || /first reading/i.test(document.body.innerText))) break;
  }
  const f1 = await page.evaluate(() => ({ cells: document.querySelectorAll("[data-cell]:not(.gap)").length, red: document.querySelectorAll("[data-cell].over").length, slider: !!document.querySelector("[data-limit]"), first: /first reading/i.test(document.body.innerText), scrollW: document.documentElement.scrollWidth }));
  let moved = true;
  if (f1.cells >= 12) {
    await page.evaluate(() => { const r = document.querySelector("[data-limit]"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(r, "0.2"); r.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.waitForTimeout(600);
    const red2 = await page.evaluate(() => document.querySelectorAll("[data-cell].over").length);
    moved = red2 !== f1.red;
  }
  check(width, 5, f1.slider && (f1.cells >= 12 || f1.first) && moved, `census: slider ${f1.slider}, ${f1.cells} priced cells, line moved ${moved}`);
  check(width, 7, f1.scrollW <= width, "/census scrolls horizontally");

  // 6: a wallet prints as a ledger
  await page.goto(`${base}/proof?q=${DEMO_WALLET}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  let ledger = false;
  for (let i = 0; i < 60 && !ledger; i++) {
    await page.waitForTimeout(1000);
    ledger = await page.evaluate(() => !!document.querySelector(".wb-num") && document.querySelectorAll(".wb-hold .wb-row").length >= 2);
  }
  check(width, 6, ledger, "the demo wallet did not print a ledger with a total and holdings");
  check(width, 7, await page.evaluate(() => document.documentElement.scrollWidth) <= width, "/proof scrolls horizontally");
}
await browser.close();
if (fails.length) { console.log("FAIL\n  " + fails.join("\n  ")); process.exit(1); }
console.log("PASS: PRD-V5 checks at 1440 and 390");
