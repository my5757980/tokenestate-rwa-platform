"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { RENT_DISTRIBUTOR_ADDRESS, RENT_DISTRIBUTOR_ABI, USDC_ADDRESS, ERC20_ABI } from "@/lib/contracts";

// ─── Deposit Rent (owner) ────────────────────────────────────────────────────

// Two steps, like buying: approve USDC, then deposit once the approval is mined (the caller runs
// executeDeposit when approveSuccess turns true).
export function useRentDeposit() {
  const { writeContract: approveUSDC, data: approveHash, isPending: isApproving, error: approveError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: deposit, data: depositHash, isPending: isDepositing, error: depositError } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  const isPending = isApproving || isApproveConfirming || isDepositing || isDepositConfirming;
  const error = depositError ?? approveError;

  const depositRent = (propertyId: bigint, amount: bigint) => {
    approveUSDC({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [RENT_DISTRIBUTOR_ADDRESS, amount],
    });
  };

  const executeDeposit = (propertyId: bigint, amount: bigint) =>
    deposit({
      address: RENT_DISTRIBUTOR_ADDRESS,
      abi: RENT_DISTRIBUTOR_ABI,
      functionName: "depositRent",
      args: [propertyId, amount],
    });

  return { depositRent, executeDeposit, approveSuccess, isPending, isSuccess, error };
}

// ─── Claim Rent (investor) ────────────────────────────────────────────────────

export function useClaimRent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRent = (propertyId: bigint) =>
    writeContract({
      address: RENT_DISTRIBUTOR_ADDRESS,
      abi: RENT_DISTRIBUTOR_ABI,
      functionName: "claimRent",
      args: [propertyId],
    });

  const claimRentBatch = (propertyIds: bigint[]) =>
    writeContract({
      address: RENT_DISTRIBUTOR_ADDRESS,
      abi: RENT_DISTRIBUTOR_ABI,
      functionName: "claimRentBatch",
      args: [propertyIds],
    });

  return { claimRent, claimRentBatch, isPending, isSuccess, error };
}

// ─── Pending Rent (view) ──────────────────────────────────────────────────────

export function usePendingRent(holder: `0x${string}` | undefined, propertyId: bigint | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: RENT_DISTRIBUTOR_ADDRESS,
    abi: RENT_DISTRIBUTOR_ABI,
    functionName: "pendingRent",
    args: holder && propertyId !== undefined ? [holder, propertyId] : undefined,
    query: { enabled: !!holder && propertyId !== undefined, refetchInterval: 30_000 },
  });

  return { pendingRent: data as bigint | undefined, isLoading, refetch };
}
