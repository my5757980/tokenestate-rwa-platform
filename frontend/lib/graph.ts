import type { Property, Holding, Listing, RentClaim } from "@/types";

const GRAPH_URL = process.env.NEXT_PUBLIC_GRAPH_URL ?? "";

// The Graph returns BigInt fields as strings and Bytes as hex strings. Every query below uses the field
// names of subgraph/schema.graphql, and the results are converted to the app's types here, so the UI
// never does arithmetic on a string.

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

interface RawProperty {
  id: string; owner: string; metadataCID: string;
  totalSupply: string; pricePerToken: string; tokensSold: string; active: boolean;
}

const PROPERTY_FIELDS = "id owner metadataCID totalSupply pricePerToken tokensSold active";

function toProperty(p: RawProperty): Property {
  return {
    id: p.id,
    owner: p.owner,
    metadataCID: p.metadataCID,
    totalSupply: BigInt(p.totalSupply),
    pricePerToken: BigInt(p.pricePerToken),
    tokensSold: BigInt(p.tokensSold),
    active: p.active,
  };
}

// ─── Properties ───────────────────────────────────────────────────────────────

const PROPERTIES_QUERY = `
  query GetProperties {
    properties(orderBy: id, orderDirection: asc, where: { active: true }) { ${PROPERTY_FIELDS} }
  }
`;

export async function getAllProperties(): Promise<Property[]> {
  const data = await query<{ properties: RawProperty[] }>(PROPERTIES_QUERY);
  return data.properties.map(toProperty);
}

const PROPERTY_QUERY = `
  query GetProperty($id: ID!) {
    property(id: $id) { ${PROPERTY_FIELDS} }
  }
`;

export async function getPropertyById(id: string): Promise<Property | null> {
  const data = await query<{ property: RawProperty | null }>(PROPERTY_QUERY, { id });
  return data.property ? toProperty(data.property) : null;
}

// ─── Holdings ─────────────────────────────────────────────────────────────────

const HOLDINGS_QUERY = `
  query GetHoldings($holder: Bytes!) {
    holdings(where: { holder: $holder, balance_gt: "0" }) {
      id holder balance
      property { id metadataCID pricePerToken }
    }
  }
`;

interface RawHolding {
  id: string; holder: string; balance: string;
  property: { id: string; metadataCID: string; pricePerToken: string };
}

export async function getHoldingsByHolder(holder: string): Promise<Holding[]> {
  const data = await query<{ holdings: RawHolding[] }>(HOLDINGS_QUERY, { holder: holder.toLowerCase() });
  return data.holdings.map((h) => ({
    id: h.id,
    propertyId: h.property.id,
    holder: h.holder,
    balance: BigInt(h.balance),
    metadataCID: h.property.metadataCID,
    pricePerToken: BigInt(h.property.pricePerToken),
  }));
}

// ─── Listings ─────────────────────────────────────────────────────────────────

// Listing.status is an Int in the subgraph: 0 = Active, 1 = Sold, 2 = Cancelled
const STATUS = ["Active", "Sold", "Cancelled"] as const;
const LISTING_FIELDS = "id seller amount pricePerToken status createdAt property { id metadataCID }";

const LISTINGS_QUERY = `
  query GetListings($propertyId: String!) {
    listings(where: { status: 0, property: $propertyId }, orderBy: createdAt, orderDirection: desc) { ${LISTING_FIELDS} }
  }
`;

const ALL_LISTINGS_QUERY = `
  query GetAllListings {
    listings(where: { status: 0 }, orderBy: createdAt, orderDirection: desc) { ${LISTING_FIELDS} }
  }
`;

interface RawListing {
  id: string; seller: string; amount: string; pricePerToken: string; status: number; createdAt: string;
  property: { id: string; metadataCID: string };
}

function toListing(l: RawListing): Listing {
  return {
    id: l.id,
    seller: l.seller,
    property: l.property,
    amount: BigInt(l.amount),
    pricePerToken: BigInt(l.pricePerToken),
    status: STATUS[l.status] ?? "Active",
    createdAt: BigInt(l.createdAt),
  };
}

export async function getActiveListings(propertyId?: string): Promise<Listing[]> {
  const data = propertyId
    ? await query<{ listings: RawListing[] }>(LISTINGS_QUERY, { propertyId })
    : await query<{ listings: RawListing[] }>(ALL_LISTINGS_QUERY);
  return data.listings.map(toListing);
}

// ─── Rent History ─────────────────────────────────────────────────────────────

const RENT_CLAIMS_QUERY = `
  query GetRentClaims($claimant: Bytes!) {
    rentClaims(where: { claimant: $claimant }, orderBy: timestamp, orderDirection: desc) {
      id claimant amount timestamp
      property { id metadataCID }
    }
  }
`;

interface RawRentClaim {
  id: string; claimant: string; amount: string; timestamp: string;
  property: { id: string; metadataCID: string };
}

export async function getRentHistory(claimer: string): Promise<RentClaim[]> {
  const data = await query<{ rentClaims: RawRentClaim[] }>(RENT_CLAIMS_QUERY, { claimant: claimer.toLowerCase() });
  return data.rentClaims.map((c) => ({
    id: c.id,
    claimer: c.claimant,
    property: c.property,
    amount: BigInt(c.amount),
    timestamp: BigInt(c.timestamp),
  }));
}
