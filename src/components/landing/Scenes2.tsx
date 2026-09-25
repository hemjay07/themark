"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getIssuerControls, getMintExtensions } from "@/lib/jupiter";
import { reconcileTransaction, type TxReconciliation } from "@/lib/tx";
import { TOKEN_LIST, displayName } from "@/lib/tokens";
import Odometer from "@/components/Odometer";
import Scene from "@/components/landing/Scene";
import { useInView } from "@/lib/useInView";

// The wallet behind the real OpenAI purchase that overpaid on 24 September (src/app/proof/ProofClient.tsx).
export const DEMO_WALLET = "6CtLg5reXUya6bdxG14iHzYFxeJw2FAhm2evq93TTyBH";
export const DEMO_SIG = "26DWMSrq96WP5BMv7x54jmA9ZC8PjT7CGJVtQ7bE7SwUArZbGWi4TnQ8ByweDCJ6s7MxKewnnPYEwk2TL5osD2aq";

const POWERS: Array<{ key: string; label: string }> = [
  { key: "permanentDelegate", label: "can take tokens out of your wallet" },
  { key: "pausableConfig", label: "can halt all trading, with no warning" },
  { key: "transferHook", label: "runs its own code on every transfer" },
  { key: "confidentialTransferMint", label: "can hide what moved" },
];

type Read = { symbol: string; keys: string[] | null };

export function SceneIssuer() {
  const [reads, setReads] = useState<Read[] | null>(null);
  const [near, setNear] = useState(false);
  const { ref: nearRef, inView: nearView } = useInView<HTMLDivElement>(0.01);
  useEffect(() => {
    if (nearView) setNear(true);
  }, [nearView]);
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    (async () => {
      const rows: Read[] = [];
      for (const t of TOKEN_LIST) {
        if (cancelled) return;
        const ext = await getMintExtensions(t.mint);
        const controls = getIssuerControls(ext);
        rows.push({ symbol: t.symbol, keys: controls === null ? null : controls.map((c) => c.key) });
      }
      if (!cancelled) setReads(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [near]);
  const readable = reads?.filter((r) => r.keys !== null) ?? [];
  const canTake = readable.filter((r) => r.keys!.includes("permanentDelegate")).length;
  return (
    <Scene id="issuer" index={7} kicker="What the issuer can do">
      <div className="split" ref={nearRef}>
        <div>
          <div className="num red rv wipe">
            {reads ? <Odometer value={canTake} decimals={0} /> : "…"}
            <span className="num-of"> of {TOKEN_LIST.length}</span>
          </div>
          <p className="body rv" style={{ ["--d" as string]: "140ms" }}>
            of these tokens let the issuer take them out of your wallet without asking you. Read from each token&apos;s own
            settings on Solana, right now. None of it shows up in a price.
          </p>
        </div>
        <div className="powers rv" style={{ ["--d" as string]: "160ms" }}>
          {POWERS.map((p, i) => {
            const names = readable.filter((r) => r.keys!.includes(p.key)).map((r) => displayName(r.symbol));
            return (
              <div key={p.key} className="power" style={{ ["--d" as string]: `${200 + i * 90}ms` }}>
                <div className="power-l">The issuer {p.label}</div>
                <div className="power-t">
                  {!reads ? <span className="chip dim">reading…</span> : names.length ? names.map((n) => <span key={n} className="chip">{n}</span>) : <span className="chip dim">none of these</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

export function SceneWallet() {
  const router = useRouter();
  const [q, setQ] = useState("");
  // the example receipt is read off the chain as the scene comes near: its figure is live, like /proof's
  const { ref: nearRef, inView: near } = useInView<HTMLDivElement>(0.01);
  const [demo, setDemo] = useState<TxReconciliation | null | undefined>(undefined);
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    reconcileTransaction(DEMO_SIG)
      .then((r) => {
        if (!cancelled) setDemo(r);
      })
      .catch(() => {
        if (!cancelled) setDemo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [near]);
  const over = demo ? demo.vsShareUsd > 0 : true;
  const go = (v: string) => {
    const t = v.trim();
    if (t) router.push(`/proof?q=${encodeURIComponent(t)}`);
  };
  const scanMine = async () => {
    const sol = (window as any)?.solana;
    if (!sol) return go(DEMO_WALLET);
    try {
      await sol.connect();
      go(sol.publicKey.toString());
    } catch {
      // the person closed the wallet prompt
    }
  };
  return (
    <Scene id="wallet" index={8} kicker="Were you the mark?">
      <div className="split" ref={nearRef}>
        <div>
          <h2 className="big rv wipe">
            Every trade you made,
            <br />
            <span className="dim">read off the chain.</span>
          </h2>
          <p className="body rv" style={{ ["--d" as string]: "140ms" }}>
            Paste any wallet. THE MARK finds every tokenized-stock trade it ever made, prices each one against the real
            share, and totals what it paid over. Then it reads what the wallet holds now, and what selling it all today
            would cost.
          </p>
          <form
            className="scan rv"
            style={{ ["--d" as string]: "240ms" }}
            onSubmit={(e) => {
              e.preventDefault();
              go(q);
            }}
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="a wallet address, or a trade's receipt code" spellCheck={false} aria-label="wallet address or trade signature" />
            <button type="submit" className="btn-red">
              Read it <span aria-hidden>→</span>
            </button>
          </form>
          <div className="scan-links rv" style={{ ["--d" as string]: "320ms" }}>
            <button type="button" className="link" onClick={scanMine}>
              Scan my wallet
            </button>
            <span className="sep">·</span>
            <button type="button" className="link" onClick={() => go(DEMO_WALLET)}>
              Try a real one
            </button>
          </div>
        </div>
        <a className="receipt rv" style={{ ["--d" as string]: "200ms" }} href={`/proof?sig=${DEMO_SIG}`}>
          <div className="receipt-k">A real OpenAI purchase, 24 September, priced now</div>
          <div className={`receipt-n${over ? "" : " is-under"}`}>
            {demo ? <Odometer value={Math.abs(demo.vsShareUsd)} prefix="$" /> : demo === null ? "—" : <span className="receipt-shimmer" />}
          </div>
          <div className="receipt-t">
            {demo
              ? `${over ? "more" : "less"} than ${demo.tokenReceived.toFixed(2)} OpenAI tokens are worth at the token's price now. OpenAI is private, so there is no public share price to hold it to.`
              : demo === null
                ? "The chain could not be read just now. Open the receipt to try again."
                : "reading the trade off the chain"}
          </div>
          <div className="receipt-r">
            <span>Paid</span>
            <b>{demo ? `$${demo.usdcSpent.toFixed(2)}` : "…"}</b>
          </div>
          <div className="receipt-r">
            <span>Per token</span>
            <b>{demo ? `$${demo.effectivePrice.toFixed(2)}, now $${demo.referencePrice.toFixed(2)}` : "…"}</b>
          </div>
          <div className="receipt-cta">Open the receipt <span aria-hidden>→</span></div>
        </a>
      </div>
    </Scene>
  );
}

const FAQ: Array<[string, string]> = [
  ["Does THE MARK hold my money?", "No. Your wallet signs the order and holds the tokens. THE MARK never holds funds or keys."],
  ["Where do the numbers come from?", "A live Jupiter quote for your exact order, plus the token's own fee read from its settings on Solana. The comparison of all stocks is one shared reading, refreshed every two minutes, and it says how old it is."],
  ["Why was my trade blocked?", "It would have cost more than the limit you set. Buy less, split it into smaller orders, pick another stock, or raise your limit."],
  ["Which stocks?", "Eight tokenized stocks on Solana: the S&P 500, Apple, Tesla, Intel and Palantir from xStocks, and OpenAI, Kalshi and SpaceX from Tessera."],
  ["Is this financial advice?", "No. It shows what an order costs and what a wallet paid. The decision stays yours."],
];

export function SceneAnswers() {
  return (
    <Scene id="answers" index={9} kicker="Straight answers">
      <div className="split">
        <div>
          <h2 className="big rv wipe">
            Straight
            <br />
            <span className="dim">answers.</span>
          </h2>
          <div className="launch rv" style={{ ["--d" as string]: "200ms" }}>
            <div className="launch-t">Launch the app.</div>
            <p className="body">Pick a stock, set your limit, and see what the order really costs before your wallet is asked to sign.</p>
            <a className="btn-red" href="/check">
              Launch app <span aria-hidden>→</span>
            </a>
          </div>
        </div>
        <div className="faq rv" style={{ ["--d" as string]: "140ms" }}>
          {FAQ.map(([qq, a]) => (
            <details key={qq} className="faq-i">
              <summary>{qq}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
      <footer className="foot rv" style={{ ["--d" as string]: "300ms" }}>
        <span>THE MARK · built for Stocklana 2026</span>
        <span>Every figure on this page is read live, or carries its date.</span>
      </footer>
    </Scene>
  );
}
