import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

const SITE_URL = "https://themark.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "THE MARK",
    template: "%s · THE MARK",
  },
  description:
    "Before you buy a tokenized stock on Solana, THE MARK renders the pool you're about to trade into, shows what your exact order really costs, and signs or refuses.",
  openGraph: {
    title: "THE MARK",
    description:
      "It shows what your order really costs before you sign. THE MARK renders the pool you're about to trade into, then signs or refuses.",
    url: SITE_URL,
    siteName: "THE MARK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "THE MARK",
    description:
      "It shows what your order really costs before you sign. THE MARK renders the pool you're about to trade into, then signs or refuses.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
