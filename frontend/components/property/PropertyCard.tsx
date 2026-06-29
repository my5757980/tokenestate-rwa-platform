import Link from "next/link";
import type { Property } from "@/types";
import { formatUnits } from "viem";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const available = property.totalSupply - property.tokensSold;
  const percentSold = property.totalSupply > 0n
    ? Number((property.tokensSold * 100n) / property.totalSupply)
    : 0;
  const priceUSD = Number(formatUnits(property.pricePerToken, 6)).toFixed(2);

  return (
    <Link href={`/properties/${property.id}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-neon-green/50 transition-all duration-200 cursor-pointer group">
        {property.imageUrl && (
          <img
            src={property.imageUrl}
            alt={property.name ?? "Property"}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        {!property.imageUrl && (
          <div className="w-full h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-gray-600 text-4xl">🏢</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-white group-hover:text-neon-green transition-colors">
              {property.name ?? `Property #${property.id}`}
            </h3>
            <p className="text-gray-400 text-sm">{property.location ?? "Location unavailable"}</p>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Price per token</span>
            <span className="text-white font-medium">${priceUSD} USDC</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Available</span>
            <span className="text-white font-medium">
              {available.toString()} / {property.totalSupply.toString()}
            </span>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-neon-green h-1.5 rounded-full"
              style={{ width: `${percentSold}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs">{percentSold}% sold</p>

          {!property.active && (
            <span className="inline-block bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">
              Paused
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
