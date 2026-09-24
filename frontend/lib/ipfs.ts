import type { PropertyMetadata } from "@/types";

const GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/";

/// Upload a file and metadata JSON to IPFS, returns metadata CID.
/// The upload runs on the server (app/api/ipfs), which holds the Pinata keys; the browser never sees them.
export async function uploadPropertyToIPFS(
  file: File | null,
  metadata: PropertyMetadata
): Promise<string> {
  const formData = new FormData();
  if (file) formData.append("file", file);
  formData.append("metadata", JSON.stringify(metadata));

  const res = await fetch("/api/ipfs", { method: "POST", body: formData });
  const body = await res.json().catch(() => ({})) as { cid?: string; error?: string };
  if (!res.ok || !body.cid) throw new Error(body.error ?? `IPFS upload failed (HTTP ${res.status})`);
  return body.cid;
}

/// Fetch property metadata JSON from IPFS
export async function fetchPropertyMetadata(cid: string): Promise<PropertyMetadata> {
  const res = await fetch(`${GATEWAY}${cid}`);
  if (!res.ok) throw new Error(`Failed to fetch metadata for CID: ${cid}`);
  return res.json() as Promise<PropertyMetadata>;
}
