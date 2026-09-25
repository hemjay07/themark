// Ledger check: the /proof demo path must succeed on a cold browser. Exits 0 only if the example
// trade reconciles and shows what was paid, and nothing on the page says REFUSED.
import { createRequire } from "node:module";
const require = createRequire(process.env.HOME + "/.claude/surface/package.json");
const { chromium } = require("playwright-core");
const base = process.argv[2] || "http://localhost:3000";
const b = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(base + "/proof", { waitUntil: "domcontentloaded", timeout: 45000 });
// since PRD-V5 the real example trade prints on load; nothing to click
let ok = false, text = "";
for (let i = 0; i < 30 && !ok; i++) {
  await p.waitForTimeout(1000);
  text = await p.evaluate(() => document.body.innerText);
  if (/refused/i.test(text) && !/reading/i.test(text)) break;
  ok = /paid/i.test(text) && /solscan/i.test(text) && !/refused/i.test(text);
}
await b.close();
console.log(ok ? "PASS: demo trade reconciled" : "FAIL: " + (text.match(/refused[^\n]*\n?[^\n]*/i)?.[0] ?? "no reconciliation after 30s"));
process.exit(ok ? 0 : 1);
