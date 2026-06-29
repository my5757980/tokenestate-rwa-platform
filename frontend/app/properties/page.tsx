import { PropertyCard } from "@/components/property/PropertyCard";
import { getAllProperties } from "@/lib/graph";
import { fetchPropertyMetadata } from "@/lib/ipfs";
import type { Property } from "@/types";

async function getPropertiesWithMetadata(): Promise<Property[]> {
  try {
    const properties = await getAllProperties();
    return await Promise.all(
      properties.map(async (p) => {
        try {
          const meta = await fetchPropertyMetadata(p.metadataCID);
          return { ...p, name: meta.name, location: meta.location, imageUrl: meta.imageUrl };
        } catch {
          return p;
        }
      })
    );
  } catch {
    return [];
  }
}

export default async function PropertiesPage() {
  const properties = await getPropertiesWithMetadata();

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Available Properties</h1>
        <p className="text-gray-400">
          Invest in fractional real estate. Buy tokens, earn rent, trade on marketplace.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No properties listed yet.</p>
          <p className="text-gray-600 mt-2">Be the first to tokenize your real estate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
