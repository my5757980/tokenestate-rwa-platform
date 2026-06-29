"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ListPropertyForm } from "@/components/property/ListPropertyForm";

export default function ListPropertyPage() {
  const { isConnected } = useAccount();

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">List Your Property</h1>
        <p className="text-gray-400">
          Tokenize your real estate and sell fractional ownership to investors worldwide.
        </p>
      </div>

      {!isConnected ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-gray-400">Connect your wallet to list a property.</p>
          <ConnectButton />
        </div>
      ) : (
        <ListPropertyForm />
      )}
    </div>
  );
}
