export interface Property {
  id: string;
  owner: string;
  metadataCID: string;
  totalSupply: bigint;
  pricePerToken: bigint;
  tokensSold: bigint;
  active: boolean;
  // resolved from IPFS
  name?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
}

export interface PropertyMetadata {
  name: string;
  location: string;
  description: string;
  totalValue: string;
  imageUrl?: string;
  documentCIDs?: string[];
  createdAt: string;
}

export interface Holding {
  id: string;
  propertyId: string;
  holder: string;
  balance: bigint;
  metadataCID?: string;
  // resolved from IPFS
  propertyName?: string;
  location?: string;
  pricePerToken?: bigint;
}

export interface Listing {
  id: string;
  seller: string;
  property: Property;
  amount: bigint;
  pricePerToken: bigint;
  status: "Active" | "Sold" | "Cancelled";
  createdAt: bigint;
}

export interface RentDistribution {
  id: string;
  property: Property;
  depositor: string;
  totalAmount: bigint;
  timestamp: bigint;
  blockNumber: bigint;
}

export interface RentClaim {
  id: string;
  claimer: string;
  property: Property;
  amount: bigint;
  timestamp: bigint;
}

export interface KYCBadge {
  id: string;
  holder: string;
  issuedAt: bigint;
  revoked: boolean;
}

export type TxStatus = "idle" | "pending" | "success" | "error";
