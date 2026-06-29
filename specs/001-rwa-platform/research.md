# Research: TokenEstate RWA Platform

**Branch**: `001-rwa-platform` | **Date**: 2026-06-27

## Decision 1 — Token Standard for Fractional Ownership

**Decision**: ERC-1155 (one contract, multiple token IDs — one per property)

**Rationale**: Each property gets its own tokenId. All fractional shares of that
property are fungible with each other (holder A's share = holder B's share of same
property). ERC-1155 `balanceOf(address, tokenId)` gives exact fractional holding.
Gas-efficient batch operations via `safeBatchTransferFrom`.

**Alternatives considered**:
- ERC-721 — non-fungible per token, not suitable for fungible fractions
- ERC-20 per property — separate contract per property, expensive and complex

---

## Decision 2 — Rent Distribution Pattern

**Decision**: Pull pattern (Accumulator / Reward-Per-Token)

**Rationale**: Push pattern (loop over all holders in one tx) breaks at scale —
gas limit exceeded with >100 holders. Pull accumulator is the industry standard
(Synthetix, Compound) and is O(1) per claim regardless of holder count.

```
totalRentPerToken[propertyId] += rentDeposited / totalSupply(propertyId)
pendingRent(user) = (totalRentPerToken - userDebt[user]) * balance(user)
```

User debt is snapshotted on every balance change (buy, sell, transfer).

**Alternatives considered**:
- Push to all holders — O(n) gas, breaks with many investors
- Off-chain Merkle claim — adds complexity, requires trusted off-chain relayer

---

## Decision 3 — Soulbound Token (KYC Badge) Implementation

**Decision**: Custom ERC-721 overriding `_update` to block transfers

**Rationale**: OpenZeppelin 5.x consolidates all mint/transfer/burn into `_update`.
Blocking transfers is a one-line override: `require(from == address(0), ...)`.
ERC-721 (not ERC-1155) because each badge is unique per person (1 per wallet).
AccessControl with `KYC_ADMIN_ROLE` for issuance and revocation.

**Alternatives considered**:
- EIP-5192 (Minimal Soulbound) — standard not widely supported yet in OZ 5.x
- Off-chain credential (Verifiable Credential) — requires oracle, adds trust assumption

---

## Decision 4 — Marketplace Architecture

**Decision**: Escrow-free listing model with ERC-1155 approval

**Rationale**: Seller calls `setApprovalForAll(marketplace, true)` then creates
listing. Tokens stay in seller's wallet until buyer executes purchase. Marketplace
contract pulls tokens atomically with payment. No escrow contract needed.
`ReentrancyGuard` on all state-changing functions.

**Alternatives considered**:
- Escrow (lock tokens in marketplace contract) — more gas, seller loses liquidity
- Dutch auction / AMM — over-engineered for v1

---

## Decision 5 — IPFS Storage via Pinata

**Decision**: Pinata SDK for pinning; store only IPFS CID in contract events (not state)

**Rationale**: Storing CIDs in state wastes gas. Emit event `PropertyListed(propertyId,
owner, metadataCID)` — The Graph indexes it. Frontend reconstructs metadata from
subgraph query + IPFS gateway fetch. No on-chain string storage.

**Alternatives considered**:
- Arweave — permanent but more complex SDK, higher cost for testnet demo
- Centralized S3 — violates Constitution Principle VI

---

## Decision 6 — The Graph Subgraph Entities

**Decision**: Index 5 event types across 4 contracts

Events to index:
- `PropertyRegistry`: `PropertyListed`, `TokensPurchased`
- `RentDistributor`: `RentDeposited`, `RentClaimed`
- `Marketplace`: `ListingCreated`, `ListingFulfilled`, `ListingCancelled`
- `KYCBadge`: `BadgeIssued`, `BadgeRevoked`

Frontend queries subgraph for portfolio (holdings), rent history, marketplace
listings — avoids expensive on-chain reads.

---

## Decision 7 — Contract Upgradeability

**Decision**: Non-upgradeable for v1 (Sepolia demo); transparent proxy pattern documented
for mainnet

**Rationale**: OpenZeppelin Upgrades transparent proxy adds complexity and attack
surface. For a testnet demo, simple non-upgradeable contracts are safer and faster
to ship. Constitution Principle V flags this for future ADR before mainnet.

**Alternatives considered**:
- UUPS proxy — recommended for mainnet, documented as next step
- Diamond pattern (EIP-2535) — over-engineered for v1 scope

📋 **Architectural decision detected**: Non-upgradeable vs proxy pattern for mainnet.
Document? Run `/sp.adr contract-upgradeability-strategy`

---

## Decision 8 — Frontend State Management

**Decision**: Wagmi v2 hooks + TanStack Query (built into Wagmi v2) — no additional
state library

**Rationale**: Wagmi v2 uses TanStack Query internally for caching, refetching, and
optimistic updates. All contract state is derived from on-chain reads via typed hooks.
No Redux/Zustand needed — wallet state = Wagmi, server state = The Graph via fetch.

**Alternatives considered**:
- Zustand — useful for complex UI state, overkill for this scope
- SWR — less integrated with Wagmi v2 than TanStack Query
