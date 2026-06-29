"use client";

import { formatUnits } from "viem";
import { usePendingRent, useClaimRent } from "@/hooks/useRentDistributor";
import { TxButton } from "@/components/ui/TxButton";
import type { Holding } from "@/types";

interface PortfolioCardProps {
  holding: Holding;
  holderAddress: `0x${string}`;
}

export function PortfolioCard({ holding, holderAddress }: PortfolioCardProps) {
  const { pendingRent } = usePendingRent(holderAddress, BigInt(holding.propertyId));
  const { claimRent, isPending, isSuccess } = useClaimRent();

  const rentUSD = pendingRent ? Number(formatUnits(pendingRent, 6)).toFixed(2) : "0.00";
  const valueUSD = Number(formatUnits(BigInt(holding.balance) * BigInt(holding.pricePerToken ?? 0), 6)).toFixed(2);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white font-semibold">{holding.propertyName ?? `Property #${holding.propertyId}`}</h3>
          <p className="text-gray-400 text-sm mt-0.5">{holding.location}</p>
        </div>
        <span className="text-neon-green font-bold text-lg">{holding.balance} tokens</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Portfolio Value</p>
          <p className="text-white font-medium mt-1">${valueUSD}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Pending Rent</p>
          <p className="text-neon-green font-medium mt-1">${rentUSD}</p>
        </div>
      </div>

      {pendingRent && pendingRent > 0n && (
        <TxButton
          onClick={() => claimRent(BigInt(holding.propertyId))}
          status={isPending ? "pending" : isSuccess ? "success" : "idle"}
          className="w-full text-sm"
        >
          Claim ${rentUSD} USDC
        </TxButton>
      )}
    </div>
  );
}
