"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { KYC_BADGE_ADDRESS, KYC_BADGE_ABI } from "@/lib/contracts";

export function useKYCBadge(address: `0x${string}` | undefined) {
  const { data: isVerified, isLoading } = useReadContract({
    address: KYC_BADGE_ADDRESS,
    abi: KYC_BADGE_ABI,
    functionName: "isVerified",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  return { isVerified: isVerified as boolean | undefined, isLoading };
}

export function useIssueBadge() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const issueBadge = (to: `0x${string}`) =>
    writeContract({ address: KYC_BADGE_ADDRESS, abi: KYC_BADGE_ABI, functionName: "issueBadge", args: [to] });

  return { issueBadge, isPending, isSuccess, error };
}

export function useRevokeBadge() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const revokeBadge = (holder: `0x${string}`) =>
    writeContract({ address: KYC_BADGE_ADDRESS, abi: KYC_BADGE_ABI, functionName: "revokeBadge", args: [holder] });

  return { revokeBadge, isPending, isSuccess, error };
}
