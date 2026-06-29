"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { TxButton } from "@/components/ui/TxButton";
import { useListProperty } from "@/hooks/usePropertyRegistry";
import { uploadPropertyToIPFS } from "@/lib/ipfs";
import type { TxStatus } from "@/types";

export function ListPropertyForm() {
  const { isConnected } = useAccount();
  const { listProperty, isPending, isSuccess, error } = useListProperty();

  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    totalValue: "",
    tokenSupply: "",
    pricePerToken: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const txStatus: TxStatus = isPending ? "pending" : isSuccess ? "success" : "idle";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;

    setUploading(true);
    setUploadError(null);

    try {
      const cid = await uploadPropertyToIPFS(file, {
        name: form.name,
        location: form.location,
        description: form.description,
        totalValue: form.totalValue,
        createdAt: new Date().toISOString(),
      });

      const supply = BigInt(form.tokenSupply);
      const price = parseUnits(form.pricePerToken, 6); // USDC 6 decimals
      await listProperty(cid, supply, price);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fields = [
    { key: "name", label: "Property Name", placeholder: "e.g. Downtown Lahore Apartment" },
    { key: "location", label: "Location", placeholder: "e.g. Gulberg III, Lahore, Pakistan" },
    { key: "description", label: "Description", placeholder: "Describe the property..." },
    { key: "totalValue", label: "Total Value (USD)", placeholder: "e.g. 100000" },
    { key: "tokenSupply", label: "Token Supply", placeholder: "e.g. 1000" },
    { key: "pricePerToken", label: "Price Per Token (USDC)", placeholder: "e.g. 100" },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
          {key === "description" ? (
            <textarea
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              rows={3}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
            />
          ) : (
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
            />
          )}
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Property Documents (optional)
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-gray-400 text-sm"
        />
      </div>

      {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
      {error && <p className="text-red-400 text-sm">{error.message}</p>}
      {isSuccess && (
        <p className="text-neon-green text-sm">Property listed successfully!</p>
      )}

      <TxButton
        onClick={() => {}}
        status={uploading ? "pending" : txStatus}
        disabled={!isConnected || uploading}
      >
        {uploading ? "Uploading to IPFS..." : "List Property"}
      </TxButton>
    </form>
  );
}
