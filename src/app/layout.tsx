import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE MARK · A",
  description: "Fill-cost guard for tokenized stocks on Solana. Know the real price before signing.",
  openGraph: {
    title: "THE MARK",
    description: "Tokenized stock cost transparency on Solana",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
        {children}
      </body>
    </html>
  );
}
