import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE MARK — Real Cost Before You Sign",
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
      <body className="bg-black text-white antialiased" style={{ backgroundColor: "#0A0A0F" }}>
        <div className="min-h-screen flex flex-col">
          {/* Top nav */}
          <header className="border-b border-zinc-800 px-4 py-4">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <h1 className="text-2xl font-bold text-amber-400">THE MARK</h1>
              <nav className="text-sm text-zinc-400 space-x-6">
                <a href="/" className="hover:text-amber-400">Home</a>
                <a href="/proof" className="hover:text-amber-400">Proof</a>
                <a href="https://github.com" target="_blank" className="hover:text-amber-400">GitHub</a>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 max-w-6xl mx-auto w-full p-4">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-zinc-800 mt-12 py-6 px-4 text-center text-sm text-zinc-500">
            <p>Live on Solana Mainnet. Real transactions, real proofs.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
