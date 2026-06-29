"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { CreateListingForm } from "@/components/marketplace/CreateListingForm";
import { getActiveListings } from "@/lib/graph";
import type { Listing } from "@/types";

export default function MarketplacePage() {
  const { isConnected } = useAccount();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    getActiveListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketplace</h1>
          <p className="text-gray-400 mt-1">Buy and sell fractional property tokens</p>
        </div>
        {isConnected ? (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-neon-green text-black font-semibold rounded-lg hover:opacity-90"
          >
            {showCreate ? "Hide Form" : "+ Create Listing"}
          </button>
        ) : (
          <ConnectButton />
        )}
      </div>

      {/* Create listing form */}
      {showCreate && isConnected && (
        <div className="max-w-md">
          <CreateListingForm />
        </div>
      )}

      {/* Active listings */}
      {loading ? (
        <p className="text-gray-400">Loading listings...</p>
      ) : listings.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg">No active listings yet.</p>
          <p className="text-gray-500 text-sm mt-2">Buy tokens first, then list them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
