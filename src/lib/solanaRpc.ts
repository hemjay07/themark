// Server-only. One JSON-RPC call to Solana, with the retry the public endpoints need. Measured
// 2026-09-25: the default mainnet-beta endpoint allows about ten getTransaction calls per ten seconds
// (a wallet scan took a minute), publicnode read thirty in 1.5 s but wants a token for address-history
// lookups. So each method starts on the endpoint that serves it, and every refusal moves the retry to
// the next one. A refusal is "try again", never a fact about the chain.
const PUBLICNODE = "https://solana-rpc.publicnode.com";
const MAINNET = "https://api.mainnet-beta.solana.com";
const OWN = process.env.SOLANA_RPC_URL;
const HEAVY = new Set(["getTransaction", "getAccountInfo"]);

function endpointsFor(method: string): string[] {
  const order = HEAVY.has(method) ? [OWN, PUBLICNODE, MAINNET] : [OWN, MAINNET, PUBLICNODE];
  return order.filter((u): u is string => Boolean(u));
}

export async function rpc<T = any>(method: string, params: unknown[]): Promise<T> {
  const endpoints = endpointsFor(method);
  let lastErr = "rpc unreachable";
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = endpoints[attempt % endpoints.length];
    if (attempt >= endpoints.length) await new Promise((r) => setTimeout(r, Math.min(4000, 500 * 2 ** (attempt - endpoints.length))));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        lastErr = `rpc ${res.status}`;
        continue;
      }
      const data = await res.json();
      if (data.error) {
        // a refusal that no endpoint will answer differently (an unsupported transaction version, a
        // bad parameter) is final; a throttle or a paywall sends the question to the next endpoint
        if (data.error.code === -32015 || data.error.code === -32602) throw new Error(String(data.error.message || "rpc error"));
        lastErr = String(data.error.message || "rpc error");
        continue;
      }
      return data.result as T;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/not supported|Invalid param/i.test(msg)) throw e;
      lastErr = msg;
    }
  }
  throw new Error(lastErr);
}
