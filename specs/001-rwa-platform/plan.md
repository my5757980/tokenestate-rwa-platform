# Implementation Plan: TokenEstate RWA Platform

**Branch**: `001-rwa-platform` | **Date**: 2026-06-27
**Spec**: specs/001-rwa-platform/spec.md

## Summary

Build a real estate tokenization dApp on Ethereum Sepolia where property owners
mint ERC-1155 fractional tokens, investors buy shares in USDC, rent income is
distributed via a pull-accumulator pattern, KYC is enforced via soulbound badges,
and a secondary marketplace enables peer-to-peer token trading.

## Technical Context

**Language/Version**: Solidity ^0.8.24 (contracts), TypeScript 5.x (all other code)
**Primary Dependencies**: OpenZeppelin 5.x, Hardhat 2.x, Next.js 15, Wagmi v2, Viem 2.x, RainbowKit 2.x
**Storage**: IPFS/Pinata (property metadata + docs), The Graph (event indexing)
**Testing**: Hardhat + Chai + Hardhat Gas Reporter, Vitest + Playwright
**Target Platform**: Ethereum Sepolia testnet, Vercel (frontend deploy)
**Project Type**: Web application (contracts + frontend + subgraph — 3 independent layers)
**Performance Goals**: Mint <= 150k gas, transfer <= 80k gas, rent claim O(1) per user
**Constraints**: No upgradeability v1 (ADR needed for mainnet), USDC 6-decimal precision
**Scale/Scope**: Demo — Sepolia testnet, up to 100 properties, up to 1000 investors

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Security-First | PASS | OZ 5.x, ReentrancyGuard, Pausable, no custom crypto |
| II. Type-Safe TS | PASS | strict mode, typechain ABI generation, no any |
| III. Test-First | PASS | Tests written RED before implementation in each task |
| IV. Gas Optimization | PASS | Pull rent O(1), mappings preferred, gas budgets enforced |
| V. Modular Architecture | PASS | contracts/frontend/subgraph independently buildable |
| VI. Decentralized Storage | PASS | IPFS/Pinata for metadata, CIDs in events, The Graph indexing |

All 6 gates pass. No violations.

## Project Structure

### Source Code

```
tokenestate/
├── contracts/
│   ├── PropertyRegistry.sol        # ERC-1155 + listing + primary purchase
│   ├── RentDistributor.sol         # Pull-accumulator rent distribution
│   ├── KYCBadge.sol                # Soulbound ERC-721 (non-transferable)
│   ├── Marketplace.sol             # Secondary peer-to-peer token market
│   ├── interfaces/
│   │   ├── IPropertyRegistry.sol
│   │   ├── IRentDistributor.sol
│   │   ├── IMarketplace.sol
│   │   └── IKYCBadge.sol
│   └── mocks/
│       └── MockUSDC.sol            # Testnet ERC-20 with public mint
├── ignition/modules/
│   └── TokenEstateModule.ts        # Deploys all 5 contracts in order
├── test/
│   ├── PropertyRegistry.test.ts
│   ├── RentDistributor.test.ts
│   ├── KYCBadge.test.ts
│   └── Marketplace.test.ts
├── subgraph/
│   ├── schema.graphql
│   ├── subgraph.yaml
│   └── src/mappings/
│       ├── registry.ts
│       ├── rentDistributor.ts
│       └── marketplace.ts
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Landing
│   │   ├── providers.tsx           # Wagmi + RainbowKit
│   │   ├── properties/
│   │   │   ├── page.tsx            # Browse properties
│   │   │   └── [id]/page.tsx       # Detail + buy tokens
│   │   ├── list-property/page.tsx  # Owner: tokenize property
│   │   ├── dashboard/page.tsx      # Portfolio + rent income
│   │   └── marketplace/page.tsx    # Secondary listings
│   ├── components/
│   │   ├── property/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyDetail.tsx
│   │   │   └── ListPropertyForm.tsx
│   │   ├── marketplace/
│   │   │   ├── ListingCard.tsx
│   │   │   └── CreateListingModal.tsx
│   │   ├── dashboard/
│   │   │   ├── PortfolioTable.tsx
│   │   │   └── RentHistory.tsx
│   │   └── ui/
│   │       ├── ConnectButton.tsx
│   │       ├── TxButton.tsx
│   │       └── Navbar.tsx
│   ├── hooks/
│   │   ├── usePropertyRegistry.ts
│   │   ├── useRentDistributor.ts
│   │   ├── useMarketplace.ts
│   │   └── useKYCBadge.ts
│   ├── lib/
│   │   ├── contracts.ts
│   │   ├── ipfs.ts
│   │   └── graph.ts
│   └── types/index.ts
├── hardhat.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Key Contract Patterns

### PropertyRegistry — ERC-1155 transfer hook

Every token transfer must snapshot the rent accumulator debt.
Override `_update` to call `rentDistributor.snapshotDebt(from, to, propertyId)`.
This ensures pending rent is calculated correctly after every ownership change.

### RentDistributor — Pull accumulator

```
totalRentPerToken[p] += rentDeposited / totalSupply(p)   [scaled 1e18]
pending(user, p) = (totalRentPerToken[p] - debt[p][user]) * balance(user) / 1e18
```

Debt is updated on every balance change (purchase, transfer, marketplace trade).
Users call `claimRent(propertyId)` whenever they want to withdraw.

### KYCBadge — Soulbound override

Override OZ ERC-721 `_update`: if `from != address(0)` revert NonTransferable.
One badge per wallet enforced via `holderToBadge` mapping check before mint.

### Marketplace — Escrow-free atomic swap

Seller pre-approves Marketplace via ERC-1155 `setApprovalForAll`.
`buyListing` pulls USDC from buyer to seller AND pulls tokens from seller to buyer
in one transaction. No tokens locked in marketplace contract.

## Ignition Deployment Order

```
1. MockUSDC          (no deps)
2. KYCBadge          (no deps)
3. PropertyRegistry  (needs MockUSDC address)
4. RentDistributor   (needs MockUSDC + PropertyRegistry)
5. Marketplace       (needs MockUSDC + PropertyRegistry)
6. setRentDistributor(rentDistributor)  on PropertyRegistry
```

## Deployment Command

```bash
npx hardhat ignition deploy ignition/modules/TokenEstateModule.ts \
  --network sepolia --verify
```

## ADR Suggestions

Architectural decision detected: Non-upgradeable contracts v1 vs transparent
proxy for mainnet. Document? Run /sp.adr contract-upgradeability-strategy

Architectural decision detected: Pull rent accumulator vs push distribution loop.
Document? Run /sp.adr rent-distribution-pattern
