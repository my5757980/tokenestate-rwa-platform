// Server-side only (imported by app/api/ipfs/route.ts): it reads the Pinata secret, which must never
// reach the browser. Next.js exposes only NEXT_PUBLIC_* variables to client code, so the upload that
// used to run in the browser could never see these keys and always failed.
import type { PropertyMetadata } from "@/types";

const GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/";
const PINATA_API = "https://api.pinata.cloud";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export class PinataNotConfigured extends Error {}

function credentials() {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;
  if (!apiKey || !secretKey) throw new PinataNotConfigured("IPFS upload is not configured: set PINATA_API_KEY and PINATA_SECRET_KEY on the server.");
  return { pinata_api_key: apiKey, pinata_secret_api_key: secretKey };
}

/** Pin the optional document, then the metadata JSON pointing at it; returns the metadata CID. */
export async function pinPropertyToIPFS(file: File | null, metadata: PropertyMetadata): Promise<string> {
  const auth = credentials();
  let imageCID: string | undefined;

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("pinataMetadata", JSON.stringify({ name: `tokenestate-${metadata.name}-doc` }));
    const fileRes = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, { method: "POST", headers: auth, body: formData });
    if (!fileRes.ok) throw new Error("Failed to upload file to IPFS");
    imageCID = ((await fileRes.json()) as { IpfsHash: string }).IpfsHash;
  }

  const jsonRes = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({
      pinataContent: { ...metadata, imageUrl: imageCID ? `${GATEWAY}${imageCID}` : undefined, createdAt: new Date().toISOString() },
      pinataMetadata: { name: `tokenestate-${metadata.name}-metadata` },
    }),
  });
  if (!jsonRes.ok) throw new Error("Failed to upload metadata to IPFS");
  return ((await jsonRes.json()) as { IpfsHash: string }).IpfsHash;
}
