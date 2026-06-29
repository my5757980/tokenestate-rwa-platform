---
id: 003
title: TokenEstate RWA Platform Plan
stage: plan
date: 2026-06-27
surface: agent
model: claude-sonnet-4-6
feature: 001-rwa-platform
branch: 001-rwa-platform
user: Muhammad Yaseen
command: /sp.plan
labels: ["plan","solidity","erc1155","rwa","hardhat","wagmi","nextjs","the-graph"]
links:
  spec: specs/001-rwa-platform/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-rwa-platform/plan.md
  - specs/001-rwa-platform/research.md
  - specs/001-rwa-platform/data-model.md
  - specs/001-rwa-platform/quickstart.md
  - specs/001-rwa-platform/contracts/IPropertyRegistry.sol
  - specs/001-rwa-platform/contracts/IRentDistributor.sol
  - specs/001-rwa-platform/contracts/IMarketplace.sol
  - specs/001-rwa-platform/contracts/IKYCBadge.sol
tests:
  - null
---

## Prompt

001-rwa-platform — TokenEstate RWA Real Estate Tokenization Platform. Read spec from
specs/001-rwa-platform/spec.md. Tech stack: Solidity ^0.8.24 + OpenZeppelin 5.x
(ERC-1155 for property tokens, ERC-20 USDC payments, Ownable, ReentrancyGuard,
Pausable), Hardhat 2.x + Hardhat Ignition for deploy, Next.js 15 App Router +
TypeScript strict, Tailwind CSS, Wagmi v2 + Viem 2.x + RainbowKit 2.x, IPFS/Pinata
for property docs, The Graph subgraph for event indexing, Sepolia testnet, Vercel
frontend deploy.

## Response snapshot

Generated full implementation plan with 8 research decisions, data model (5 entities
+ full GraphQL schema), 4 Solidity interface contracts, quickstart.md, and plan.md.

Key architecture decisions:
- ERC-1155 (one contract, tokenId per property) over ERC-721/ERC-20-per-property
- Pull accumulator rent pattern (O(1) per claim) over push loop (O(n), gas-unsafe)
- Soulbound KYC badge via ERC-721 _update override (revert if from != address(0))
- Escrow-free marketplace: seller pre-approves, atomic swap in buyListing()
- Non-upgradeable v1 (ADR flagged for mainnet proxy decision)
- 5 contracts: PropertyRegistry, RentDistributor, KYCBadge, Marketplace, MockUSDC
- Hardhat Ignition module deploys all 5 in dependency order
- Subgraph indexes 8 event types across 4 contracts
- Frontend: Next.js 15 App Router, 4 typed Wagmi v2 hook files, The Graph queries

Constitution check: all 6 gates PASS.

## Outcome

- Impact: Full architecture defined — ready for /sp.tasks
- Tests: Test files planned in test/ directory, written RED-first per tasks
- Files: plan.md, research.md, data-model.md, quickstart.md, 4x interface contracts
- Next prompts: /sp.tasks — generate actionable task list
- Reflection: Pull rent accumulator is the most critical design decision — saves gas at scale

## Evaluation notes (flywheel)

- Failure modes observed: agent-context update script path mismatch (non-critical, skipped)
- Graders run and results (PASS/FAIL): constitution check all 6 gates PASS
- Prompt variant (if applicable): initial
- Next experiment: /sp.tasks to break plan into implementable tasks with TDD order
