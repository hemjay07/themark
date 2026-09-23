// Ledger check for the Jupiter key. Never prints the key. Passes only if .env.local holds a real-looking
// key (not the placeholder) AND Jupiter accepts it: a bad key gets 401, a good one gets 200.
import { readFileSync } from "node:fs";
let key = "";
try {
  const line = readFileSync(new URL("../.env.production.local", import.meta.url), "utf8").split("\n").find((l) => l.startsWith("JUPITER_API_KEY="));
  key = (line ?? "").slice("JUPITER_API_KEY=".length).trim();
} catch {}
if (!key || /PASTE|your_real_key/i.test(key)) { console.log("FAIL: no real JUPITER_API_KEY in .env.local"); process.exit(1); }
const res = await fetch("https://api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112", { headers: { "x-api-key": key } });
console.log(res.status === 200 ? "PASS: Jupiter accepts the key" : `FAIL: Jupiter answered ${res.status} to the key`);
process.exit(res.status === 200 ? 0 : 1);
