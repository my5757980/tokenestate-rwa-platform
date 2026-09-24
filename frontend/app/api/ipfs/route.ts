import { NextResponse } from "next/server";
import { ALLOWED_TYPES, MAX_FILE_BYTES, PinataNotConfigured, pinPropertyToIPFS } from "@/lib/pinata";
import type { PropertyMetadata } from "@/types";

// Uploads a property's document and metadata to IPFS with the server's Pinata keys. The route is open to
// anyone who can reach the site, so it takes only small PDF/JPEG/PNG files and short metadata; put rate
// limiting (or a wallet signature check) in front of it before a public launch.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Send multipart form data." }, { status: 400 });

  const rawMetadata = String(form.get("metadata") ?? "");
  if (rawMetadata.length > 10_000) return NextResponse.json({ error: "Metadata is too long." }, { status: 413 });
  let metadata: PropertyMetadata;
  try {
    metadata = JSON.parse(rawMetadata);
  } catch {
    return NextResponse.json({ error: "metadata must be JSON." }, { status: 400 });
  }
  if (!metadata?.name) return NextResponse.json({ error: "metadata.name is required." }, { status: 400 });

  const upload = form.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  if (file && file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "The document is larger than 10 MB." }, { status: 413 });
  if (file && !ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Only PDF, JPEG or PNG documents." }, { status: 415 });

  try {
    return NextResponse.json({ cid: await pinPropertyToIPFS(file, metadata) });
  } catch (e) {
    if (e instanceof PinataNotConfigured) return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "IPFS upload failed" }, { status: 502 });
  }
}
