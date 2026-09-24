"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, USDC_ADDRESS, ERC20_ABI } from "@/lib/contracts";
import type { Property } from "@/types";

// ─── List Property ────────────────────────────────────────────────────────────

export function useListProperty() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const listProperty = (metadataCID: string, totalSupply: bigint, pricePerToken: bigint) =>
    writeContract({
      address: PROPERTY_REGISTRY_ADDRESS,
      abi: PROPERTY_REGISTRY_ABI,
      functionName: "listProperty",
      args: [metadataCID, totalSupply, pricePerToken],
    });

  return { listProperty, hash, isPending: isPending || isConfirming, isSuccess, error };
}

// ─── Purchase Tokens (2-step: approve USDC → purchaseTokens) ─────────────────

export function usePurchaseTokens() {
  const { writeContract: approveUSDC, data: approveHash, isPending: isApproving, error: approveError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: buyTokens, data: buyHash, isPending: isBuying, error: buyError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: buyHash });

  const purchaseTokens = async (propertyId: bigint, amount: bigint, pricePerToken: bigint) => {
    const totalCost = amount * pricePerToken;
    // Step 1: Approve USDC spend
    approveUSDC({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [PROPERTY_REGISTRY_ADDRESS, totalCost],
    });
  };

  const executePurchase = (propertyId: bigint, amount: bigint) =>
    buyTokens({
      address: PROPERTY_REGISTRY_ADDRESS,
      abi: PROPERTY_REGISTRY_ABI,
      functionName: "purchaseTokens",
      args: [propertyId, amount],
    });

  return {
    purchaseTokens,
    executePurchase,
    approveSuccess,
    isApproving: isApproving || isApproveConfirming,
    isBuying: isBuying || isConfirming,
    isSuccess,
    error: buyError ?? approveError,
  };
}

// ─── Read: Get Property ───────────────────────────────────────────────────────

export function useGetProperty(propertyId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: PROPERTY_REGISTRY_ADDRESS,
    abi: PROPERTY_REGISTRY_ABI,
    functionName: "getProperty",
    args: propertyId !== undefined ? [propertyId] : undefined,
    query: { enabled: propertyId !== undefined },
  });

  return { property: data as Property | undefined, isLoading, error };
}

// ─── Read: Total Properties ───────────────────────────────────────────────────

export function useTotalProperties() {
  const { data, isLoading } = useReadContract({
    address: PROPERTY_REGISTRY_ADDRESS,
    abi: PROPERTY_REGISTRY_ABI,
    functionName: "totalProperties",
  });

  return { total: data as bigint | undefined, isLoading };
}

// ─── Read: Token Balance ──────────────────────────────────────────────────────

export function useTokenBalance(address: `0x${string}` | undefined, propertyId: bigint | undefined) {
  const { data, refetch } = useReadContract({
    address: PROPERTY_REGISTRY_ADDRESS,
    abi: PROPERTY_REGISTRY_ABI,
    functionName: "balanceOf",
    args: address && propertyId !== undefined ? [address, propertyId] : undefined,
    query: { enabled: !!address && propertyId !== undefined },
  });

  return { balance: data as bigint | undefined, refetch };
}

// ─── Pause / Unpause ──────────────────────────────────────────────────────────

export function usePauseProperty() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const pauseProperty = (propertyId: bigint) =>
    writeContract({
      address: PROPERTY_REGISTRY_ADDRESS,
      abi: PROPERTY_REGISTRY_ABI,
      functionName: "pauseProperty",
      args: [propertyId],
    });

  const unpauseProperty = (propertyId: bigint) =>
    writeContract({
      address: PROPERTY_REGISTRY_ADDRESS,
      abi: PROPERTY_REGISTRY_ABI,
      functionName: "unpauseProperty",
      args: [propertyId],
    });

  return { pauseProperty, unpauseProperty, isPending, isSuccess };
}
