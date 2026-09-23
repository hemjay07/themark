import ProofClient from "./ProofClient";

// Server entry: reads the receipt code from the URL so the client renders the right state from its
// very first paint instead of changing it after hydration.
export default function ProofPage({ searchParams }: { searchParams: { sig?: string | string[] } }) {
  const raw = Array.isArray(searchParams.sig) ? searchParams.sig[0] : searchParams.sig;
  const sig = raw && /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(raw.trim()) ? raw.trim() : null;
  return <ProofClient initialSig={sig} />;
}
