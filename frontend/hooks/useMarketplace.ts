"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, USDC_ADDRESS, ERC20_ABI } from "@/lib/contracts";

export function useCreateListing() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const approveListing = (marketAddr: `0x${string}`) =>
    writeContract({
      address: PROPERTY_REGISTRY_ADDRESS,
      abi: PROPERTY_REGISTRY_ABI,
      functionName: "setApprovalForAll",
      args: [marketAddr, true],
    });

  const createListing = (propertyId: bigint, amount: bigint, pricePerToken: bigint) =>
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "createListing",
      args: [propertyId, amount, pricePerToken],
    });

  return { approveListing, createListing, isPending, isSuccess, error };
}

export function useBuyListing() {
  const { writeContract: approveUSDC, data: approveHash } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { writeContract: buy, data: buyHash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: buyHash });

  const buyListing = (listingId: bigint, totalCost: bigint) =>
    approveUSDC({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "approve", args: [MARKETPLACE_ADDRESS, totalCost] });

  const executeBuy = (listingId: bigint) =>
    buy({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "buyListing", args: [listingId] });

  return { buyListing, executeBuy, approveSuccess, isPending, isSuccess, error };
}

export function useCancelListing() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelListing = (listingId: bigint) =>
    writeContract({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: "cancelListing", args: [listingId] });

  return { cancelListing, isPending, isSuccess, error };
}

export function useGetListing(listingId: bigint | undefined) {
  const { data, isLoading } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getListing",
    args: listingId !== undefined ? [listingId] : undefined,
    query: { enabled: listingId !== undefined },
  });
  return { listing: data, isLoading };
}
