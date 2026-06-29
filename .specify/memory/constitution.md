<!-- SYNC IMPACT REPORT
Version Change: (none) → 1.0.0
Modified Principles: N/A (initial creation)
Added Sections:
  - Core Principles (6 principles)
  - Tech Stack Standards
  - Development Workflow
  - Governance
Templates Checked:
  ✅ .specify/templates/plan-template.md — Constitution Check gates align
  ✅ .specify/templates/spec-template.md — FR/SC structure compatible
  ✅ .specify/templates/tasks-template.md — Phase structure compatible
Deferred TODOs: none
-->

# TokenEstate Constitution

## Core Principles

### I. Security-First Smart Contracts (NON-NEGOTIABLE)

All Solidity contracts MUST be audited against OWASP Smart Contract Top 10 before
deployment. OpenZeppelin battle-tested libraries MUST be used for all token standards
(ERC-1155, ERC-20), access control, and reentrancy guards. No custom cryptography.
Contracts MUST be verified on Etherscan after every deployment. The `Ownable`,
`ReentrancyGuard`, and `Pausable` patterns MUST be applied to all state-changing
functions. Private keys and secrets MUST never appear in source code — use `.env`
exclusively.

### II. Type-Safe TypeScript (NON-NEGOTIABLE)

All frontend and tooling code MUST be written in strict TypeScript (`"strict": true`).
`any` type is FORBIDDEN — use `unknown` and narrow explicitly. ABI types MUST be
generated via `typechain` or `wagmi cli` from compiled contracts — no hand-written
ABIs. All contract interaction hooks MUST be wrapped in typed Wagmi v2 hooks using
Viem's type inference. `ts-check` MUST pass with zero errors before any PR merge.

### III. Test-First Development

Smart contract tests MUST be written before implementation (Red-Green-Refactor).
Hardhat + Chai MUST be used for all Solidity unit and integration tests. Target: ≥ 90%
branch coverage on all contracts. Frontend component tests MUST use Vitest + Testing
Library. E2E flows (wallet connect → mint → marketplace) MUST be covered by at least
one Playwright test per user story. Tests MUST fail before implementation begins —
no exceptions.

### IV. Gas Optimization

Every public/external contract function MUST be benchmarked via Hardhat Gas Reporter
before merge. Storage variables MUST use the smallest adequate type (e.g., `uint96`
for token amounts under 2^96). Mappings MUST be preferred over arrays for O(1) lookups.
Batch operations (ERC-1155 `safeBatchTransferFrom`) MUST be used wherever multiple
token movements occur in a single transaction. Gas budget per critical operation:
mint ≤ 150k gas, transfer ≤ 80k gas, rent distribution ≤ 200k gas.

### V. Modular Architecture

The codebase MUST be split into three independent layers: `contracts/` (Solidity),
`frontend/` (Next.js 15 App Router), and `subgraph/` (The Graph). Each layer MUST be
independently buildable and testable. Smart contracts MUST follow the Diamond pattern
or simple proxy pattern for upgradeability — monolithic non-upgradeable contracts are
FORBIDDEN for production. Frontend MUST use feature-based folder structure:
`/app/(features)/[feature]/`. No business logic in React components — services and
hooks only.

### VI. Decentralized Storage & Indexing

All property documents, images, and metadata MUST be stored on IPFS via Pinata — no
centralized storage (AWS S3, Firebase) for on-chain referenced data. IPFS CIDs MUST
be stored in contract events, not in contract state, to minimize gas. The Graph
subgraph MUST index all critical contract events (PropertyListed, TokensMinted,
TokensPurchased, RentDistributed) for efficient frontend queries. Fallback to direct
RPC calls is permitted only when subgraph is unavailable.

## Tech Stack Standards

**Smart Contracts**: Solidity ^0.8.24, OpenZeppelin 5.x, Hardhat 2.x, Hardhat
Ignition for deployments, Ethers.js v6 in scripts.

**Frontend**: Next.js 15 (App Router, Server Components), TypeScript 5.x, Tailwind
CSS 3.x, Wagmi v2, Viem 2.x, RainbowKit 2.x.

**Storage**: IPFS via Pinata SDK — property documents and NFT metadata.

**Indexing**: The Graph Protocol — custom subgraph for all contract events.

**Testing**: Hardhat + Chai (contracts), Vitest + Testing Library (components),
Playwright (E2E).

**Network**: Ethereum Sepolia testnet (development + demo), Ethereum mainnet (future).

**Deploy**: Vercel (frontend, auto-deploy from `main`), Hardhat Ignition (contracts).

**Package Manager**: `npm` for frontend, `npm` for Hardhat workspace.

**No exceptions to this stack without a formal ADR**.

## Development Workflow

1. **Branch**: All work on feature branches — `feature/`, `fix/`, `chore/` prefixes.
   `main` is always deployable.
2. **Spec before code**: `/sp.specify` → `/sp.plan` → `/sp.tasks` → implement.
   No code without a spec.
3. **Contract changes**: Deploy to Sepolia → verify on Etherscan → update subgraph →
   update frontend ABI types → run full test suite.
4. **PR gates**: `npx hardhat test` + `npx hardhat coverage` (≥90%) + `tsc --noEmit`
   + Playwright E2E MUST all pass green.
5. **Secrets**: All API keys (Pinata, Alchemy, WalletConnect) in `.env.local` —
   NEVER committed. `.env.example` maintained with all required keys documented.
6. **PHR**: A Prompt History Record MUST be created after every significant prompt.
   No exceptions per CLAUDE.md contract.

## Governance

This constitution is the authoritative source for all architectural and engineering
decisions on TokenEstate. It supersedes README, verbal agreements, and ad-hoc
decisions.

**Amendment procedure**: Any principle change requires an ADR (`/sp.adr`) documenting
rationale, alternatives, and migration impact. The ADR MUST be approved before the
constitution version is bumped.

**Versioning policy**:
- MAJOR: Removal or redefinition of a Core Principle.
- MINOR: New principle, new tech stack entry, new mandatory gate.
- PATCH: Wording clarification, typo fix, non-semantic refinement.

**Compliance review**: Every PR description MUST include a one-line constitution
compliance statement. CI will enforce `tsc`, `hardhat test`, and coverage thresholds
automatically.

**Version**: 1.0.0 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
