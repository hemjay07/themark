import type { Metadata } from "next";

// The census page is a client component and cannot export metadata itself, so the
// route's layout carries it and fills the root title template.
export const metadata: Metadata = {
  title: "Census",
  description:
    "Every tokenized stock on Solana measured at three order sizes, live, and ranked by what the fill actually costs.",
};

export default function CensusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
