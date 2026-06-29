"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PortfolioCard } from "@/components/dashboard/PortfolioCard";
import { useEffect, useState } from "react";
import { getHoldingsByHolder } from "@/lib/graph";
import { fetchPropertyMetadata } from "@/lib/ipfs";
import { useKYCBadge } from "@/hooks/useKYCBadge";
import type { Holding } from "@/types";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { isVerified } = useKYCBadge(address);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getHoldingsByHolder(address)
      .then(async (raw) => {
        const enriched = await Promise.all(
          raw.map(async (h) => {
            try {
              const meta = await fetchPropertyMetadata(h.metadataCID ?? "");
              return { ...h, propertyName: meta.name, location: meta.location };
            } catch {
              return h;
            }
          })
        );
        setHoldings(enriched);
      })
      .finally(() => setLoading(false));
  }, [address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <p className="text-gray-400 text-lg">Connect your wallet to view your portfolio</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
          <p className="text-gray-400 mt-1">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${isVerified ? "bg-green-900/40 text-green-400 border border-green-700" : "bg-yellow-900/40 text-yellow-400 border border-yellow-700"}`}>
          {isVerified ? "KYC Verified" : "KYC Pending"}
        </div>
      </div>

      {/* Holdings */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">My Holdings</h2>
        {loading ? (
          <p className="text-gray-400">Loading portfolio...</p>
        ) : holdings.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No holdings yet. <a href="/properties" className="text-neon-green underline">Browse properties</a> to invest.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holdings.map((h) => (
              <PortfolioCard key={h.propertyId} holding={h} holderAddress={address!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
