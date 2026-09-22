import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proof",
  description:
    "A landed Solana transaction read off the chain and reconciled against what the screen promised before it was signed.",
};

export default function ProofLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
