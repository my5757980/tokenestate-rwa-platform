import type { Property, Holding, Listing, RentClaim } from "@/types";

const GRAPH_URL = process.env.NEXT_PUBLIC_GRAPH_URL ?? "";

async function query<T>(q: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, variables }),
    next: { revalidate: 30 },
  });
  const json = await res.json() as { data: T; errors?: unknown[] };
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// ─── Properties ───────────────────────────────────────────────────────────────

const PROPERTIES_QUERY = `
  query GetProperties {
    properties(orderBy: id, orderDirection: asc, where: { active: true }) {
      id owner metadataCID totalSupply pricePerToken tokensSold active
    }
  }
`;

export async function getAllProperties(): Promise<Property[]> {
  const data = await query<{ properties: Property[] }>(PROPERTIES_QUERY);
  return data.properties;
}

const PROPERTY_QUERY = `
  query GetProperty($id: ID!) {
    property(id: $id) {
      id owner metadataCID totalSupply pricePerToken tokensSold active
    }
  }
`;

export async function getPropertyById(id: string): Promise<Property | null> {
  const data = await query<{ property: Property | null }>(PROPERTY_QUERY, { id });
  return data.property;
}

// ─── Holdings ─────────────────────────────────────────────────────────────────

const HOLDINGS_QUERY = `
  query GetHoldings($holder: Bytes!) {
    holdings(where: { holder: $holder, amount_gt: "0" }) {
      id holder amount totalRentClaimed
      property { id metadataCID totalSupply pricePerToken active }
    }
  }
`;

export async function getHoldingsByHolder(holder: string): Promise<Holding[]> {
  const data = await query<{ holdings: Holding[] }>(HOLDINGS_QUERY, { holder: holder.toLowerCase() });
  return data.holdings;
}

// ─── Listings ─────────────────────────────────────────────────────────────────

const LISTINGS_QUERY = `
  query GetListings($propertyId: String) {
    listings(where: { status: "Active" ${`${GRAPH_URL ? ', property: $propertyId' : ''}`} }) {
      id seller amount pricePerToken status createdAt
      property { id metadataCID }
    }
  }
`;

const ALL_LISTINGS_QUERY = `
  query GetAllListings {
    listings(where: { status: "Active" }, orderBy: createdAt, orderDirection: desc) {
      id seller amount pricePerToken status createdAt
      property { id metadataCID totalSupply pricePerToken active }
    }
  }
`;

export async function getActiveListings(propertyId?: string): Promise<Listing[]> {
  if (propertyId) {
    const data = await query<{ listings: Listing[] }>(LISTINGS_QUERY, { propertyId });
    return data.listings;
  }
  const data = await query<{ listings: Listing[] }>(ALL_LISTINGS_QUERY);
  return data.listings;
}

// ─── Rent History ─────────────────────────────────────────────────────────────

const RENT_CLAIMS_QUERY = `
  query GetRentClaims($claimer: Bytes!) {
    rentClaims(where: { claimer: $claimer }, orderBy: timestamp, orderDirection: desc) {
      id claimer amount timestamp
      property { id metadataCID }
    }
  }
`;

export async function getRentHistory(claimer: string): Promise<RentClaim[]> {
  const data = await query<{ rentClaims: RentClaim[] }>(RENT_CLAIMS_QUERY, { claimer: claimer.toLowerCase() });
  return data.rentClaims;
}
