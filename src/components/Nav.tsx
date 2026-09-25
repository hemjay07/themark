"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

// Full names where there is room; one word on a phone, where the full names ran off the screen.
const ROUTES: Array<{ href: string; label: string; short: string }> = [
  { href: "/check", label: "Check an order", short: "Check" },
  { href: "/census", label: "Compare stocks", short: "Compare" },
  { href: "/proof", label: "Verify a trade", short: "Verify" },
];

const mono: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontVariantNumeric: "tabular-nums",
};

const wordmarkStyle: CSSProperties = {
  height: "22px",
  width: "auto",
  display: "block",
};

const linkBase: CSSProperties = {
  ...mono,
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "6px 0",
  borderBottom: "1px solid transparent",
  whiteSpace: "nowrap",
};

export default function Nav() {
  const pathname = usePathname();
  // the end of the product is a signed order, so the wallet is always one click away
  const [wallet, setWallet] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(true);
  useEffect(() => {
    const sol = (window as any)?.solana;
    setHasWallet(Boolean(sol));
    if (sol?.isConnected && sol.publicKey) setWallet(sol.publicKey.toString());
    const onWallet = () => {
      const k = (window as any)?.solana?.publicKey;
      if (k) setWallet(k.toString());
    };
    window.addEventListener("mark:wallet", onWallet);
    return () => window.removeEventListener("mark:wallet", onWallet);
  }, []);
  const connect = async () => {
    const sol = (window as any)?.solana;
    if (!sol) return;
    try {
      await sol.connect();
      window.dispatchEvent(new Event("mark:wallet"));
    } catch {
      // the person closed the wallet prompt: nothing to do
    }
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(10,10,15,.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <a href="/" aria-label="THE MARK" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <img src="/brand/lockup.svg" alt="THE MARK" style={wordmarkStyle} />
      </a>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {ROUTES.map((route) => {
          const active = pathname === route.href;
          return (
            <a
              key={route.href}
              href={route.href}
              aria-current={active ? "page" : undefined}
              style={{
                ...linkBase,
                color: active ? "var(--text-primary)" : "var(--text-dim)",
                borderBottomColor: active ? "var(--text-primary)" : "transparent",
              }}
            >
              <span className="nav-full">{route.label}</span>
              <span className="nav-short">{route.short}</span>
            </a>
          );
        })}
        {pathname !== "/check" ? (
          <a className="nav-wallet nav-launch" href="/check">Launch app <span aria-hidden>→</span></a>
        ) : wallet ? (
          <span className="nav-wallet is-on">{wallet.slice(0, 4)}…{wallet.slice(-4)}</span>
        ) : hasWallet ? (
          <button className="nav-wallet" onClick={connect}>Connect wallet</button>
        ) : (
          <a className="nav-wallet" href="https://phantom.app" target="_blank" rel="noreferrer">Get a wallet</a>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-short{display:none}
        @media (max-width:640px){ .nav-full{display:none} .nav-short{display:inline} }
        .nav-wallet{font-family:Archivo,sans-serif;font-size:13px;font-weight:600;padding:8px 14px;border-radius:6px;
          border:1px solid var(--text-primary);background:var(--text-primary);color:var(--bg);cursor:pointer;
          text-decoration:none;white-space:nowrap;transition:transform 120ms ease-out}
        .nav-wallet:hover{transform:translateY(-1px)}
        .nav-launch{background:var(--signal);border-color:var(--signal);color:#fff;border-radius:999px;padding:8px 16px}
        .nav-wallet.is-on{background:transparent;color:var(--text-muted);border-color:var(--border);cursor:default;
          font-family:"JetBrains Mono",monospace;font-weight:400}
        @media (max-width:640px){ .nav-wallet{display:none} }
      ` }} />
    </nav>
  );
}
