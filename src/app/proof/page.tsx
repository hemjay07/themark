import ProofClient from "./ProofClient";

// Server entry: reads the receipt code from the URL so the client renders the right state from its
// very first paint instead of changing it after hydration.
// ?sig= is a trade, ?wallet= a wallet, and ?q= either: a wallet address is 32 to 44 characters, a
// signature 64 to 90, so the length says which.
export default function ProofPage({ searchParams }: { searchParams: { sig?: string | string[]; wallet?: string | string[]; q?: string | string[] } }) {
  const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  const q = one(searchParams.q);
  const sigRaw = one(searchParams.sig) || (/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(q) ? q : "");
  const walletRaw = one(searchParams.wallet) || (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q) ? q : "");
  const sig = /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(sigRaw) ? sigRaw : null;
  const wallet = !sig && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletRaw) ? walletRaw : null;
  return <ProofClient initialSig={sig} initialWallet={wallet} />;
}
