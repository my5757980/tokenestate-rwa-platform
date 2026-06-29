"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TxButton } from "@/components/ui/TxButton";
import { usePurchaseTokens, useTokenBalance, usePauseProperty } from "@/hooks/usePropertyRegistry";
import { useRentDeposit } from "@/hooks/useRentDistributor";
import type { Property, TxStatus } from "@/types";

interface PropertyDetailProps {
  property: Property;
}

export function PropertyDetail({ property }: PropertyDetailProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("1");
  const [rentAmount, setRentAmount] = useState("");

  const { purchaseTokens, executePurchase, approveSuccess, isApproving, isBuying, isSuccess, error } = usePurchaseTokens();
  const { balance } = useTokenBalance(address, BigInt(property.id));
  const { pauseProperty, unpauseProperty, isPending: isPausing } = usePauseProperty();
  const { depositRent, isPending: isDepositing, isSuccess: rentSuccess } = useRentDeposit();

  const isOwner = address?.toLowerCase() === property.owner.toLowerCase();
  const available = property.totalSupply - property.tokensSold;
  const priceUSD = Number(formatUnits(property.pricePerToken, 6)).toFixed(2);
  const totalCost = (BigInt(amount || "0") * property.pricePerToken);

  // Auto-execute purchase after USDC approval
  useEffect(() => {
    if (approveSuccess) {
      executePurchase(BigInt(property.id), BigInt(amount));
    }
  }, [approveSuccess]);

  const buyStatus: TxStatus = isApproving || isBuying ? "pending" : isSuccess ? "success" : "idle";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Property Info */}
      <div className="space-y-6">
        {property.imageUrl && (
          <img src={property.imageUrl} alt={property.name ?? ""} className="w-full h-64 object-cover rounded-xl" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">{property.name ?? `Property #${property.id}`}</h1>
          <p className="text-gray-400 mt-1">{property.location}</p>
        </div>
        {property.description && <p className="text-gray-300">{property.description}</p>}

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Price per Token", value: `$${priceUSD} USDC` },
            { label: "Total Supply", value: property.totalSupply.toString() },
            { label: "Available", value: available.toString() },
            { label: "Your Balance", value: balance?.toString() ?? "0" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">{label}</p>
              <p className="text-white font-semibold mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-6">
        {/* Buy Tokens */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Buy Tokens</h2>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Number of Tokens</label>
            <input
              type="number"
              min="1"
              max={available.toString()}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Cost</span>
            <span className="text-white font-medium">${Number(formatUnits(totalCost, 6)).toFixed(2)} USDC</span>
          </div>

          {error && <p className="text-red-400 text-sm">{error.message}</p>}
          {isSuccess && <p className="text-neon-green text-sm">Purchase successful!</p>}

          {isConnected ? (
            <TxButton
              onClick={() => purchaseTokens(BigInt(property.id), BigInt(amount), property.pricePerToken)}
              status={buyStatus}
              disabled={available === 0n || !property.active}
            >
              {isApproving ? "Approving USDC..." : isBuying ? "Purchasing..." : "Buy Tokens"}
            </TxButton>
          ) : (
            <ConnectButton />
          )}
        </div>

        {/* Owner: Deposit Rent */}
        {isOwner && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Deposit Rent</h2>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Rent Amount (USDC)</label>
              <input
                type="number"
                min="0"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green"
              />
            </div>
            {rentSuccess && <p className="text-neon-green text-sm">Rent deposited!</p>}
            <TxButton
              onClick={() => depositRent(BigInt(property.id), BigInt(Math.floor(parseFloat(rentAmount) * 1e6)))}
              status={isDepositing ? "pending" : rentSuccess ? "success" : "idle"}
              disabled={!rentAmount || parseFloat(rentAmount) <= 0}
            >
              Deposit Rent
            </TxButton>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => property.active ? pauseProperty(BigInt(property.id)) : unpauseProperty(BigInt(property.id))}
                disabled={isPausing}
                className="text-sm text-gray-400 hover:text-white underline"
              >
                {property.active ? "Pause Property" : "Unpause Property"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
