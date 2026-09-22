"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const ROUTES: Array<{ href: string; label: string }> = [
  { href: "/", label: "Instrument" },
  { href: "/census", label: "Census" },
  { href: "/proof", label: "Proof" },
];

const mono: CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontVariantNumeric: "tabular-nums",
};

const wordmarkStyle: CSSProperties = {
  height: "16px",
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

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <a href="/" aria-label="THE MARK" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <img src="/brand/wordmark.svg" alt="THE MARK" style={wordmarkStyle} />
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
              {route.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
