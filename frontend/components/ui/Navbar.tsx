"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { KYC_BADGE_ADDRESS, KYC_BADGE_ABI } from "@/lib/contracts";

export function Navbar() {
  const { address, isConnected } = useAccount();

  const { data: isVerified } = useReadContract({
    address: KYC_BADGE_ADDRESS,
    abi: KYC_BADGE_ABI,
    functionName: "isVerified",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-neon-green">
              TokenEstate
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/properties" className="text-gray-300 hover:text-white transition-colors text-sm">
                Properties
              </Link>
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors text-sm">
                Marketplace
              </Link>
              {isConnected && (
                <>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Dashboard
                  </Link>
                  <Link href="/list-property" className="text-gray-300 hover:text-white transition-colors text-sm">
                    List Property
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isVerified
                    ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                }`}
              >
                {isVerified ? "KYC Verified" : "Unverified"}
              </span>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
