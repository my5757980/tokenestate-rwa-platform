import type { PropertyMetadata } from "@/types";

const GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/";

/// Upload a file and metadata JSON to IPFS via Pinata, returns metadata CID
export async function uploadPropertyToIPFS(
  file: File | null,
  metadata: PropertyMetadata
): Promise<string> {
  const apiKey    = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Pinata credentials not configured in environment variables");
  }

  let imageCID: string | undefined;

  // 1. Upload image/doc file if provided
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("pinataMetadata", JSON.stringify({ name: `tokenestate-${metadata.name}-doc` }));

    const fileRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { pinata_api_key: apiKey, pinata_secret_api_key: secretKey },
      body: formData,
    });

    if (!fileRes.ok) throw new Error("Failed to upload file to IPFS");
    const fileData = await fileRes.json() as { IpfsHash: string };
    imageCID = fileData.IpfsHash;
  }

  // 2. Upload metadata JSON
  const metadataWithImage: PropertyMetadata = {
    ...metadata,
    imageUrl: imageCID ? `${GATEWAY}${imageCID}` : undefined,
    createdAt: new Date().toISOString(),
  };

  const jsonRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: JSON.stringify({
      pinataContent: metadataWithImage,
      pinataMetadata: { name: `tokenestate-${metadata.name}-metadata` },
    }),
  });

  if (!jsonRes.ok) throw new Error("Failed to upload metadata to IPFS");
  const jsonData = await jsonRes.json() as { IpfsHash: string };
  return jsonData.IpfsHash;
}

/// Fetch property metadata JSON from IPFS
export async function fetchPropertyMetadata(cid: string): Promise<PropertyMetadata> {
  const res = await fetch(`${GATEWAY}${cid}`);
  if (!res.ok) throw new Error(`Failed to fetch metadata for CID: ${cid}`);
  return res.json() as Promise<PropertyMetadata>;
}
