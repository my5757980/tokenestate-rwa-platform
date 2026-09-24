"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { TxButton } from "@/components/ui/TxButton";
import { useCreateListing } from "@/hooks/useMarketplace";
import { MARKETPLACE_ADDRESS } from "@/lib/contracts";
import { txErrorMessage } from "@/lib/txError";
import { useEffect } from "react";

export function CreateListingForm() {
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  // Both steps share one write hook, so its isSuccess first means "approved", then "listed"
  const [step, setStep] = useState<"approve" | "approving" | "create" | "creating" | "done">("approve");
  const approved = step !== "approve" && step !== "approving";

  const { approveListing, createListing, isPending, isSuccess, error } = useCreateListing();

  useEffect(() => {
    if (!isSuccess) return;
    if (step === "approving") setStep("create");
    if (step === "creating") setStep("done");
  }, [isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approved) {
      setStep("approving");
      approveListing(MARKETPLACE_ADDRESS);
    } else {
      setStep("creating");
      createListing(BigInt(propertyId), BigInt(amount), parseUnits(price, 6));
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

      {error && <p className="text-red-400 text-sm">{txErrorMessage(error)}</p>}
      {step === "done" && <p className="text-neon-green text-sm">Listing created!</p>}

      <TxButton onClick={() => {}} status={isPending ? "pending" : "idle"} className="w-full">
        {!approved ? "Step 1: Approve Marketplace" : "Step 2: Create Listing"}
      </TxButton>
    </form>
  );
}
