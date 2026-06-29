"use client";

import { useState } from "react";
import { TxButton } from "@/components/ui/TxButton";
import { useCreateListing } from "@/hooks/useMarketplace";
import { MARKETPLACE_ADDRESS } from "@/lib/contracts";
import { useEffect } from "react";

export function CreateListingForm() {
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [approved, setApproved] = useState(false);

  const { approveListing, createListing, isPending, isSuccess, error } = useCreateListing();

  useEffect(() => {
    if (isSuccess && !approved) {
      setApproved(true);
    }
  }, [isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approved) {
      approveListing(MARKETPLACE_ADDRESS);
    } else {
      createListing(BigInt(propertyId), BigInt(amount), BigInt(Math.floor(parseFloat(price) * 1e6)));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">Create Listing</h2>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Property ID</label>
        <input
          type="number" min="1" required value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green"
          placeholder="e.g. 1"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Number of Tokens</label>
        <input
          type="number" min="1" required value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green"
          placeholder="e.g. 50"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Price per Token (USDC)</label>
        <input
          type="number" min="0" step="0.01" required value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green"
          placeholder="e.g. 75.00"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error.message}</p>}
      {isSuccess && approved && <p className="text-neon-green text-sm">Listing created!</p>}

      <TxButton onClick={() => {}} status={isPending ? "pending" : "idle"} className="w-full">
        {!approved ? "Step 1: Approve Marketplace" : "Step 2: Create Listing"}
      </TxButton>
    </form>
  );
}
