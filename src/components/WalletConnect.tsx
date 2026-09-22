"use client";

import { useState, useEffect } from "react";

export function WalletConnect() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const hasPhantom = () => {
    return (window as any)?.solana?.isPhantom;
  };

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (!hasPhantom()) return;
      try {
        const response = await (window as any).solana.connect({ onlyIfTrusted: true });
        setAddress(response.publicKey.toString());
        setConnected(true);
      } catch (err) {
        // Not connected yet
      }
    };
    checkConnection();
  }, []);

  const handleConnect = async () => {
    if (!hasPhantom()) {
      setError("Phantom wallet not installed. Please install Phantom.");
      return;
    }

    try {
      const response = await (window as any).solana.connect();
      setAddress(response.publicKey.toString());
      setConnected(true);
      setError("");
    } catch (err: any) {
      setError(err.message || "Connection failed");
    }
  };

  const handleDisconnect = async () => {
    try {
      await (window as any).solana.disconnect();
      setConnected(false);
      setAddress("");
    } catch (err: any) {
      setError(err.message || "Disconnect failed");
    }
  };

  return (
    <div className="card">
      {connected ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">Connected Wallet</p>
          <p className="text-sm font-mono bg-zinc-800 p-2 rounded break-all">
            {address.slice(0, 4)}...{address.slice(-4)}
          </p>
          <button
            onClick={handleDisconnect}
            className="w-full py-2 px-4 bg-red-900 hover:bg-red-800 rounded-lg text-red-300 transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleConnect}
            className="gold-button w-full"
          >
            Connect Phantom Wallet
          </button>
          {error && <p className="error-text text-center">{error}</p>}
          <p className="text-xs text-zinc-500 text-center">
            Demo wallet has ~$20 USDC + 0.02 SOL available for one $25 order
          </p>
        </div>
      )}
    </div>
  );
}
