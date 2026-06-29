"use client";

import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { TxButton } from "@/components/ui/TxButton";
import { useBuyListing, useCancelListing } from "@/hooks/useMarketplace";
import { useEffect } from "react";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { address } = useAccount();
  const { buyListing, executeBuy, approveSuccess, isPending, isSuccess, error } = useBuyListing();
  const { cancelListing, isPending: isCancelling } = useCancelListing();

  const isSeller = address?.toLowerCase() === listing.seller.toLowerCase();
  const totalCost = BigInt(listing.amount) * BigInt(listing.pricePerToken);
  const priceUSD = Number(formatUnits(BigInt(listing.pricePerToken), 6)).toFixed(2);
  const totalUSD = Number(formatUnits(totalCost, 6)).toFixed(2);

  useEffect(() => {
    if (approveSuccess) executeBuy(BigInt(listing.id));
  }, [approveSuccess]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">Property #{listing.property?.id ?? listing.id}</p>
          <p className="text-white font-semibold text-lg mt-0.5">{listing.amount.toString()} tokens</p>
        </div>
        <div className="text-right">
          <p className="text-neon-green font-bold text-xl">${priceUSD}</p>
          <p className="text-gray-400 text-xs mt-0.5">per token</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-3 flex justify-between">
        <span className="text-gray-400 text-sm">Total Cost</span>
        <span className="text-white font-medium">${totalUSD} USDC</span>
      </div>

      <p className="text-gray-500 text-xs">
        Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
      </p>

      {error && <p className="text-red-400 text-sm">{error.message}</p>}
      {isSuccess && <p className="text-neon-green text-sm">Purchase successful!</p>}

      {isSeller ? (
        <TxButton
          onClick={() => cancelListing(BigInt(listing.id))}
          status={isCancelling ? "pending" : "idle"}
          className="w-full bg-red-900/40 border-red-700 hover:bg-red-800/40"
        >
          Cancel Listing
        </TxButton>
      ) : (
        <TxButton
          onClick={() => buyListing(BigInt(listing.id), totalCost)}
          status={isPending ? "pending" : isSuccess ? "success" : "idle"}
          className="w-full"
        >
          {isPending ? "Processing..." : `Buy for $${totalUSD}`}
        </TxButton>
      )}
    </div>
  );
}
