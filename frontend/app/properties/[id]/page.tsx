import { notFound } from "next/navigation";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { getPropertyById } from "@/lib/graph";
import { fetchPropertyMetadata } from "@/lib/ipfs";
import type { Property } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  // Enrich with IPFS metadata
  let enriched: Property = property;
  try {
    const meta = await fetchPropertyMetadata(property.metadataCID);
    enriched = { ...property, name: meta.name, location: meta.location, description: meta.description, imageUrl: meta.imageUrl };
  } catch {
    // use on-chain data only if IPFS fails
  }

  return (
    <div className="py-8">
      <PropertyDetail property={enriched} />
    </div>
  );
}
