// Acceptance for design/PRD-V4-LANDING.md: the story at / and the tool at /check, in a real browser at
// 1440 and 390. Exits 0 only if every check holds. Usage: node scripts/check-v4.mjs http://localhost:3000
import { createRequire } from "node:module";
const require = createRequire(process.env.HOME + "/.claude/surface/package.json");
const { chromium } = require("playwright-core");
const base = process.argv[2] || "http://localhost:3000";
const fails = [];
const check = (w, n, ok, what) => { if (!ok) fails.push(`${w} #${n} ${what}`); };
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());

for (const width of [1440, 390]) {
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  // the census can be cold (about 25 s); wait for the hero's figure or its "reading" state to settle
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1000);
    const ready = await page.evaluate(() => /\$\d/.test(document.querySelector(".hero-ticket")?.innerText ?? ""));
    if (ready) break;
  }
  // scroll every scene into view so its live reads and entrances run
  const ids = await page.evaluate(() => [...document.querySelectorAll("[data-scene]")].map((s) => s.id));
  for (const id of ids) {
    await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ behavior: "instant", block: "start" }), id);
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(6000);
  const s = await page.evaluate(() => {
    const txt = document.body.innerText;
    const nav = document.querySelector("nav")?.innerText ?? "";
    return {
      scenes: document.querySelectorAll("[data-scene]").length,
      heads: [...document.querySelectorAll("[data-scene] h1, [data-scene] h2")].filter((h) => h.getBoundingClientRect().width > 0).length,
      launchNav: [...document.querySelectorAll("nav a")].some((a) => /launch app/i.test(a.innerText) && a.getAttribute("href") === "/check"),
      launchLast: [...document.querySelectorAll("#answers a")].some((a) => /launch app/i.test(a.innerText) && a.getAttribute("href") === "/check"),
      bars: document.querySelectorAll("#field .bar-row").length,
      firstReading: /first reading/i.test(document.querySelector("#field")?.innerText ?? ""),
      issuerCount: /\d+\s*of\s*8/.test(document.querySelector("#issuer")?.innerText ?? ""),
      scrollW: document.documentElement.scrollWidth,
      hasNav: /check/i.test(nav) && /compare/i.test(nav) && /verify/i.test(nav),
      walletInput: !!document.querySelector("#wallet input"),
    };
  });
  check(width, 1, s.scenes === 9, `${s.scenes} scenes, not 9`);
  check(width, 2, s.heads >= 8, `only ${s.heads} scene statements visible`);
  check(width, 3, s.launchNav && s.launchLast, "no Launch app link to /check in the nav and the last scene");
  check(width, 4, s.bars === 8 || s.firstReading, `scene 4 shows ${s.bars} bars and no first-reading state`);
  check(width, 5, s.issuerCount, "scene 7 shows no live count");
  check(width, 6, s.scrollW <= width, "horizontal scroll");
  check(width, 7, s.hasNav && s.walletInput, "nav names or the wallet input missing");

  // the tool still opens at /check with a live figure and the controls
  await page.goto(base + "/check", { waitUntil: "domcontentloaded", timeout: 45000 });
  let tool = false;
  for (let i = 0; i < 30 && !tool; i++) {
    await page.waitForTimeout(1000);
    tool = await page.evaluate(() => !!document.querySelector("[data-controls]") && /\$\d/.test(document.querySelector("[data-hero]")?.innerText ?? ""));
  }
  check(width, 8, tool, "/check did not show a live figure with its controls");
}
await browser.close();
if (fails.length) { console.log("FAIL\n  " + fails.join("\n  ")); process.exit(1); }
console.log("PASS: PRD-V4 checks at 1440 and 390");
