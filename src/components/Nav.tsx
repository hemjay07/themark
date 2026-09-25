"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

// Two navs (PRD-V5). The story's nav is its sections and the Launch app tag; it never lists the app's
// pages a second time. The app's nav is its three instruments and the wallet. Full names where there
// is room; one word on a phone, where the full names ran off the screen.
const STORY: Array<{ href: string; label: string; short: string }> = [
  { href: "/#how", label: "How it works", short: "How" },
  { href: "/#field", label: "The field", short: "Field" },
  { href: "/#wallet", label: "Were you the mark", short: "Wallet" },
  { href: "/#answers", label: "Answers", short: "" },
];
const APP: Array<{ href: string; label: string; short: string }> = [
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
  const story = pathname === "/";
  const ROUTES = story ? STORY : APP;
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
        background: "rgba(10,10,15,.94)",
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
              className={route.short ? undefined : "nav-wide-only"}
              style={{
                ...linkBase,
                color: active ? "var(--text-primary)" : "var(--text-dim)",
                borderBottomColor: active ? "var(--text-primary)" : "transparent",
              }}
            >
              <span className="nav-full">{route.label}</span>
              {route.short && <span className="nav-short">{route.short}</span>}
            </a>
          );
        })}
        {story ? (
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
        @media (max-width:640px){ .nav-full{display:none} .nav-short{display:inline} .nav-wide-only{display:none} }
        .nav-wallet{font-family:Archivo,sans-serif;font-size:13px;font-weight:600;padding:8px 14px;border-radius:6px;
          border:1px solid var(--text-primary);background:var(--text-primary);color:var(--bg);cursor:pointer;
          text-decoration:none;white-space:nowrap;transition:transform 120ms ease-out}
        .nav-wallet:hover{transform:translateY(-1px)}
        .nav-launch{position:relative;background:#F3EEE2;border-color:#F3EEE2;color:#17140F;border-radius:3px;
          padding:8px 14px 8px 26px;transform:rotate(2.5deg);transform-origin:14px 0;font-weight:700}
        .nav-launch::before{content:"";position:absolute;left:10px;top:50%;width:7px;height:7px;border-radius:50%;
          transform:translateY(-50%);background:var(--bg);box-shadow:inset 0 0 0 1.5px #B8B0A0}
        .nav-launch:hover{animation:tag-swing 1.1s cubic-bezier(.3,.7,.3,1)}
        @keyframes tag-swing{0%{transform:rotate(2.5deg)}30%{transform:rotate(-3deg)}60%{transform:rotate(3.5deg)}80%{transform:rotate(1.5deg)}100%{transform:rotate(2.5deg)}}
        @media (prefers-reduced-motion:reduce){.nav-launch:hover{animation:none}}
        .nav-wallet.is-on{background:transparent;color:var(--text-muted);border-color:var(--border);cursor:default;
          font-family:"JetBrains Mono",monospace;font-weight:400}
        @media (max-width:640px){ .nav-wallet{display:none} }
      ` }} />
    </nav>
  );
}
