# Data Model: TokenEstate RWA Platform

**Branch**: `001-rwa-platform` | **Date**: 2026-06-27

## Entity 1 — Property

Stored in `PropertyRegistry.sol` as a Solidity struct; indexed by The Graph.

```solidity
struct Property {
    uint256 id;             // auto-incremented counter
    address owner;          // wallet address of property owner
    string  metadataCID;    // IPFS CID of JSON metadata (name, location, docs)
    uint256 totalSupply;    // total fractional tokens minted (e.g. 1000)
    uint256 pricePerToken;  // in USDC (6 decimals), e.g. 10_000_000 = $10
    uint256 tokensSold;     // how many tokens have been purchased
    bool    active;         // false = paused by owner or admin
}
```

**State transitions**: `active: true` (on listing) → `active: false` (paused/sold out)

**Validation rules**:
- `totalSupply` > 0 and ≤ 1,000,000
- `pricePerToken` > 0
- `metadataCID` non-empty string
- `owner` must be `msg.sender` at listing time

**ERC-1155 mapping**: `tokenId == propertyId` — every property gets a unique ERC-1155
token ID. `balanceOf(investor, propertyId)` = number of fractional shares held.

---

## Entity 2 — PropertyToken (ERC-1155 holding)

Not stored as a struct — derived from ERC-1155 `balanceOf(account, id)`.
The Graph materialises this as a `Holding` entity.

```graphql
type Holding @entity {
    id: ID!                    # "{holderAddress}-{propertyId}"
    holder: Bytes!             # investor wallet
    property: Property!        # reference to Property entity
    amount: BigInt!            # tokens held
    totalRentClaimed: BigInt!  # cumulative USDC claimed (6 decimals)
}
```

---

## Entity 3 — RentAccumulator

Stored in `RentDistributor.sol` — implements pull-pattern rent distribution.

```solidity
struct RentState {
    uint256 totalRentPerToken;          // global accumulator (scaled 1e18)
    mapping(address => uint256) debt;   // per-user snapshot of accumulator
    uint256 pendingBalance;             // unclaimed USDC in contract
}
// mapping: propertyId => RentState
```

**Pending rent formula**:
```
pending(user, propertyId) =
    (totalRentPerToken[propertyId] - debt[propertyId][user])
    * balanceOf(user, propertyId)
    / 1e18
```

Debt is snapshotted on: initial purchase, transfer in/out, explicit claim.

---

## Entity 4 — KYCBadge

Stored in `KYCBadge.sol` — custom soulbound ERC-721.

```solidity
struct Badge {
    address holder;      // wallet address
    uint256 issuedAt;    // block.timestamp
    bool    revoked;     // true if admin revoked
}
// mapping: tokenId => Badge
// mapping: address => tokenId  (one badge per wallet)
```

**Transfer guard**:
```solidity
function _update(address from, address to, uint256 tokenId)
    internal override returns (address) {
    require(from == address(0), "KYCBadge: non-transferable");
    return super._update(from, to, tokenId);
}
```

**Validation rules**:
- One badge per wallet address (`hasBadge[wallet]` check before mint)
- Only `KYC_ADMIN_ROLE` can issue or revoke

---

## Entity 5 — MarketplaceListing

Stored in `Marketplace.sol`.

```solidity
enum ListingStatus { Active, Sold, Cancelled }

struct Listing {
    uint256        id;             // auto-incremented
    address        seller;
    uint256        propertyId;     // which property's tokens
    uint256        amount;         // number of tokens for sale
    uint256        pricePerToken;  // USDC price (6 decimals)
    ListingStatus  status;
    uint256        createdAt;      // block.timestamp
}
```

**State transitions**:
`Active` → `Sold` (buyer executes) | `Active` → `Cancelled` (seller cancels)

**Validation rules**:
- `amount` > 0 and ≤ `balanceOf(seller, propertyId)` at listing time
- `pricePerToken` > 0
- Seller must have approved Marketplace via `setApprovalForAll`

---

## Entity 6 — RentDistribution Event (The Graph)

```graphql
type RentDistribution @entity {
    id: ID!                  # tx hash + log index
    property: Property!
    depositor: Bytes!        # property owner wallet
    totalAmount: BigInt!     # USDC deposited (6 decimals)
    timestamp: BigInt!       # block.timestamp
    blockNumber: BigInt!
}

type RentClaim @entity {
    id: ID!
    claimer: Bytes!
    property: Property!
    amount: BigInt!          # USDC claimed
    timestamp: BigInt!
}
```

---

## Full GraphQL Schema Summary

```graphql
type Property @entity {
    id: ID!
    owner: Bytes!
    metadataCID: String!
    totalSupply: BigInt!
    pricePerToken: BigInt!
    tokensSold: BigInt!
    active: Boolean!
    listings: [Listing!]! @derivedFrom(field: "property")
    holdings: [Holding!]! @derivedFrom(field: "property")
    rentDistributions: [RentDistribution!]! @derivedFrom(field: "property")
}

type Holding @entity {
    id: ID!
    holder: Bytes!
    property: Property!
    amount: BigInt!
    totalRentClaimed: BigInt!
}

type Listing @entity {
    id: ID!
    seller: Bytes!
    property: Property!
    amount: BigInt!
    pricePerToken: BigInt!
    status: String!
    createdAt: BigInt!
}

type RentDistribution @entity {
    id: ID!
    property: Property!
    depositor: Bytes!
    totalAmount: BigInt!
    timestamp: BigInt!
    blockNumber: BigInt!
}

type RentClaim @entity {
    id: ID!
    claimer: Bytes!
    property: Property!
    amount: BigInt!
    timestamp: BigInt!
}

type KYCBadge @entity {
    id: ID!
    holder: Bytes!
    issuedAt: BigInt!
    revoked: Boolean!
}
```

---

## Key Relationships

```
Property (1) ──── (many) Holding        [investor's fractional shares]
Property (1) ──── (many) Listing        [secondary market offers]
Property (1) ──── (many) RentDistribution [rent deposit events]
Holding  (1) ──── (many) RentClaim      [per-holder claim history]
Wallet   (1) ──── (0..1) KYCBadge       [soulbound, max 1 per wallet]
```
