import type { Address } from "viem";

export const PROPERTY_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS ?? "") as Address;
export const RENT_DISTRIBUTOR_ADDRESS  = (process.env.NEXT_PUBLIC_RENT_DISTRIBUTOR_ADDRESS  ?? "") as Address;
export const MARKETPLACE_ADDRESS       = (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS       ?? "") as Address;
export const KYC_BADGE_ADDRESS         = (process.env.NEXT_PUBLIC_KYC_BADGE_ADDRESS         ?? "") as Address;
export const USDC_ADDRESS              = (process.env.NEXT_PUBLIC_USDC_ADDRESS              ?? "") as Address;

// ─── ABIs (minimal — expand with full typechain ABIs after compile) ───────────

export const PROPERTY_REGISTRY_ABI = [
  "function listProperty(string metadataCID, uint256 totalSupply, uint256 pricePerToken) returns (uint256)",
  "function purchaseTokens(uint256 propertyId, uint256 amount)",
  "function pauseProperty(uint256 propertyId)",
  "function unpauseProperty(uint256 propertyId)",
  "function getProperty(uint256 propertyId) view returns (tuple(uint256 id, address owner, string metadataCID, uint256 totalSupply, uint256 pricePerToken, uint256 tokensSold, bool active))",
  "function totalProperties() view returns (uint256)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "event PropertyListed(uint256 indexed propertyId, address indexed owner, string metadataCID, uint256 totalSupply, uint256 pricePerToken)",
  "event TokensPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 totalCost)",
] as const;

export const RENT_DISTRIBUTOR_ABI = [
  "function depositRent(uint256 propertyId, uint256 amount)",
  "function claimRent(uint256 propertyId)",
  "function claimRentBatch(uint256[] propertyIds)",
  "function pendingRent(address holder, uint256 propertyId) view returns (uint256)",
  "event RentDeposited(uint256 indexed propertyId, address indexed depositor, uint256 amount)",
  "event RentClaimed(uint256 indexed propertyId, address indexed claimer, uint256 amount)",
] as const;

export const MARKETPLACE_ABI = [
  "function createListing(uint256 propertyId, uint256 amount, uint256 pricePerToken) returns (uint256)",
  "function buyListing(uint256 listingId)",
  "function cancelListing(uint256 listingId)",
  "function getListing(uint256 listingId) view returns (tuple(uint256 id, address seller, uint256 propertyId, uint256 amount, uint256 pricePerToken, uint8 status, uint256 createdAt))",
  "function getActiveListings(uint256 propertyId) view returns (uint256[])",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 indexed propertyId, uint256 amount, uint256 pricePerToken)",
  "event ListingFulfilled(uint256 indexed listingId, address indexed buyer, uint256 totalCost)",
  "event ListingCancelled(uint256 indexed listingId, address indexed seller)",
] as const;

export const KYC_BADGE_ABI = [
  "function issueBadge(address to)",
  "function revokeBadge(address holder)",
  "function isVerified(address wallet) view returns (bool)",
  "function getBadgeId(address wallet) view returns (uint256)",
  "event BadgeIssued(address indexed holder, uint256 indexed tokenId)",
  "event BadgeRevoked(address indexed holder, uint256 indexed tokenId)",
] as const;

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function decimals() view returns (uint8)",
] as const;
