# Tasks: TokenEstate RWA Platform

**Input**: Design documents from `specs/001-rwa-platform/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**TDD Order**: Tests written RED (failing) FIRST → then implementation → GREEN.
**Organization**: Grouped by user story — each story independently deployable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: US1–US6 maps to spec.md user stories P1–P6

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — zero business logic, just scaffolding.

- [ ] T001 Initialize Hardhat workspace — create `package.json`, install `hardhat@^2`, `@nomicfoundation/hardhat-toolbox`, `@openzeppelin/contracts@^5`, `hardhat-gas-reporter`, `solidity-coverage` at repo root `tokenestate/`
- [ ] T002 Create `hardhat.config.ts` with Sepolia network, Etherscan verify, gas reporter, coverage, and typechain settings at `tokenestate/hardhat.config.ts`
- [ ] T003 [P] Initialize Next.js 15 App Router frontend — `npx create-next-app@latest frontend --typescript --tailwind --app --src-dir=false` inside `tokenestate/`
- [ ] T004 [P] Create `.env.example` with all required keys (ALCHEMY_RPC_URL, SEPOLIA_PRIVATE_KEY, ETHERSCAN_API_KEY, NEXT_PUBLIC_* addresses, PINATA keys, WALLETCONNECT_PROJECT_ID) at `tokenestate/.env.example`
- [ ] T005 [P] Create `tokenestate/tsconfig.json` with `"strict": true`, `"noImplicitAny": true`, `"paths"` alias for `@/` → `frontend/`
- [ ] T006 [P] Create full folder structure: `contracts/interfaces/`, `contracts/mocks/`, `ignition/modules/`, `test/`, `subgraph/src/mappings/`, `frontend/components/property/`, `frontend/components/marketplace/`, `frontend/components/dashboard/`, `frontend/components/ui/`, `frontend/hooks/`, `frontend/lib/`, `frontend/types/`
- [ ] T007 [P] Install frontend dependencies — `wagmi@^2`, `viem@^2`, `@rainbow-me/rainbowkit@^2`, `@tanstack/react-query`, `pinata-sdk` in `tokenestate/frontend/`
- [ ] T008 [P] Create `tokenestate/frontend/types/index.ts` with shared TypeScript types: `Property`, `Listing`, `Holding`, `RentClaim`, `KYCBadge` matching data-model.md entities

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure all user stories depend on. MUST complete before Phase 3+.

**WARNING**: No user story work can begin until this phase is complete.

- [ ] T009 Create `contracts/mocks/MockUSDC.sol` — ERC-20, 6 decimals, public `mint(address, uint256)` for testnet, inherits OpenZeppelin `ERC20`
- [ ] T010 [P] Write `test/MockUSDC.test.ts` — test deploy, mint, transfer, 6-decimal precision (RED first — must FAIL before T009 is complete)
- [ ] T011 Create all 4 interface contracts from specs: `contracts/interfaces/IPropertyRegistry.sol`, `contracts/interfaces/IRentDistributor.sol`, `contracts/interfaces/IMarketplace.sol`, `contracts/interfaces/IKYCBadge.sol` (copy from `specs/001-rwa-platform/contracts/`)
- [ ] T012 [P] Create `frontend/app/providers.tsx` — Wagmi v2 config with RainbowKit, Alchemy transport for Sepolia, WalletConnect projectId from env
- [ ] T013 [P] Update `frontend/app/layout.tsx` to wrap children in `<Providers>` from T012, add Tailwind base styles
- [ ] T014 [P] Create `frontend/lib/contracts.ts` — export contract addresses (from env vars) and ABI imports for all 5 contracts; typed with `as const` for Wagmi v2 type inference
- [ ] T015 [P] Create `frontend/components/ui/Navbar.tsx` — top nav with RainbowKit `<ConnectButton />`, links to /properties, /marketplace, /dashboard, /list-property
- [ ] T016 [P] Create `frontend/components/ui/TxButton.tsx` — reusable button component with `isLoading` (spinner), `isSuccess` (checkmark), `disabled` states for blockchain transactions

**Checkpoint**: `npx hardhat compile` succeeds, MockUSDC test passes, frontend builds without errors → user story work can begin.

---

## Phase 3: User Story 1 — Property Tokenization (Priority: P1) MVP

**Goal**: Property owners can list a property, upload docs to IPFS, and mint ERC-1155 fractional tokens. Listed properties appear on the browse page.

**Independent Test**: List a property → tokens appear in `balanceOf(registry, propertyId)` = totalSupply. Property visible at `/properties`.

### Tests for User Story 1 (TDD — write RED first)

- [ ] T017 [P] [US1] Write `test/PropertyRegistry.test.ts` — test `listProperty()`: valid listing emits `PropertyListed`, increments `propertyCounter`, mints correct ERC-1155 supply; test invalid cases: zero supply, zero price, empty CID (must FAIL before T019)
- [ ] T018 [P] [US1] Extend `test/PropertyRegistry.test.ts` — test `pauseProperty()` / `unpauseProperty()` access control: only owner or admin can pause; paused property blocks transfers

### Implementation for User Story 1

- [ ] T019 [US1] Create `contracts/PropertyRegistry.sol` — inherit `ERC1155`, `ERC1155Pausable`, `Ownable`, `ReentrancyGuard`; add `Property` struct and `mapping(uint256 => Property) public properties`; add `propertyCounter`, `usdc` (IERC20), `rentDistributor` (IRentDistributor) state vars
- [ ] T020 [US1] Implement `listProperty(string metadataCID, uint256 totalSupply, uint256 pricePerToken)` in `contracts/PropertyRegistry.sol` — validate inputs, increment counter, store property, call `_mint(address(this), propertyId, totalSupply, "")`, emit `PropertyListed`
- [ ] T021 [US1] Implement `pauseProperty` / `unpauseProperty` with `onlyOwner` modifier and `_pause()` / `_unpause()` calls in `contracts/PropertyRegistry.sol`
- [ ] T022 [US1] Create `frontend/lib/ipfs.ts` — `uploadToIPFS(file: File, metadata: object): Promise<string>` using Pinata SDK; returns IPFS CID; handles auth from `PINATA_API_KEY` env var
- [ ] T023 [P] [US1] Create `frontend/hooks/usePropertyRegistry.ts` — export `useListProperty()` hook using Wagmi v2 `useWriteContract` + `useWaitForTransactionReceipt`; export `useGetProperty(id)` using `useReadContract`; export `useTotalProperties()` using `useReadContract`
- [ ] T024 [P] [US1] Create `frontend/components/property/ListPropertyForm.tsx` — form with fields: name, location, description, totalValue, tokenSupply, pricePerToken; file upload for docs (calls T022 ipfs.ts); on submit calls `useListProperty()` from T023; show tx status via `TxButton`
- [ ] T025 [US1] Create `frontend/app/list-property/page.tsx` — renders `<ListPropertyForm />`, guards: wallet must be connected, show connect prompt if not
- [ ] T026 [P] [US1] Create `frontend/components/property/PropertyCard.tsx` — display: property name, location, tokens available, price per token, total value; link to `/properties/[id]`
- [ ] T027 [US1] Create `frontend/app/properties/page.tsx` — fetch all properties from The Graph (`lib/graph.ts`), render grid of `<PropertyCard />` components, loading skeleton state

**Checkpoint**: `npx hardhat test test/PropertyRegistry.test.ts` passes. List a property on local Hardhat node → it appears at `/properties`. User Story 1 independently testable.

---

## Phase 4: User Story 2 — Fractional Investment (Priority: P2)

**Goal**: Investors connect wallet, browse properties, buy fractional tokens with USDC. Holdings reflect in wallet.

**Independent Test**: Purchase 10 tokens → `balanceOf(investor, propertyId)` = 10, USDC deducted from investor.

### Tests for User Story 2 (TDD — write RED first)

- [ ] T028 [P] [US2] Extend `test/PropertyRegistry.test.ts` — test `purchaseTokens()`: correct USDC transfer from buyer, correct ERC-1155 transfer to buyer, `tokensSold` increments, emits `TokensPurchased`; test reverts: insufficient balance, over-supply, paused property (must FAIL before T029)

### Implementation for User Story 2

- [ ] T029 [US2] Implement `purchaseTokens(uint256 propertyId, uint256 amount)` in `contracts/PropertyRegistry.sol` — validate active, check available supply, call `usdc.safeTransferFrom(buyer, property.owner, cost)`, call `safeTransferFrom(address(this), buyer, propertyId, amount, "")`, update `tokensSold`, emit `TokensPurchased`
- [ ] T030 [US2] Override `_update(address from, address to, uint256[] ids, uint256[] values)` in `contracts/PropertyRegistry.sol` — call `super._update(...)`, then loop ids and call `rentDistributor.snapshotDebt(from, to, ids[i])` to keep rent accumulator in sync
- [ ] T031 [P] [US2] Extend `frontend/hooks/usePropertyRegistry.ts` — add `usePurchaseTokens()` hook: first call `useWriteContract` for USDC `approve(registryAddress, cost)`, then `useWriteContract` for `purchaseTokens(propertyId, amount)`; handle two-step tx flow
- [ ] T032 [P] [US2] Create `frontend/components/property/PropertyDetail.tsx` — show property metadata, available tokens, price; input for quantity to buy; USDC balance check; `<TxButton>` for approve + purchase; show tx hash link to Etherscan
- [ ] T033 [US2] Create `frontend/app/properties/[id]/page.tsx` — fetch property by id from The Graph, render `<PropertyDetail />`, owner view shows property management (pause/unpause)

**Checkpoint**: `npx hardhat test` passes. Connect two wallets on testnet → investor purchases tokens → `balanceOf` correct. User Stories 1 AND 2 independently testable.

---

## Phase 5: User Story 3 — Rent Distribution (Priority: P3)

**Goal**: Property owner deposits USDC rent. All token holders accumulate pending rent. Holders claim anytime via pull pattern.

**Independent Test**: Owner deposits 1000 USDC rent for property with 1000 tokens. Investor holding 100 tokens claims 100 USDC. `pendingRent(investor, propertyId)` = 0 after claim.

### Tests for User Story 3 (TDD — write RED first)

- [ ] T034 [P] [US3] Write `test/RentDistributor.test.ts` — test `depositRent()`: accumulator updates correctly, emits `RentDeposited`; test `pendingRent()`: proportional calculation for multiple holders; test `claimRent()`: transfers correct USDC, resets debt, emits `RentClaimed`; test `snapshotDebt()`: called on token transfer, no pending rent lost (must FAIL before T035)

### Implementation for User Story 3

- [ ] T035 [US3] Create `contracts/RentDistributor.sol` — inherit `Ownable`, `ReentrancyGuard`; state: `mapping(uint256 => uint256) totalRentPerToken` (1e18 scaled), `mapping(uint256 => mapping(address => uint256)) debtPerToken`; constructor takes `IERC20 usdc` and `IPropertyRegistry registry`
- [ ] T036 [US3] Implement `depositRent(uint256 propertyId, uint256 amount)` in `contracts/RentDistributor.sol` — `onlyPropertyOwner` modifier, call `usdc.safeTransferFrom(owner, address(this), amount)`, update `totalRentPerToken[propertyId] += (amount * 1e18) / registry.totalSupply(propertyId)`, emit `RentDeposited`
- [ ] T037 [US3] Implement `pendingRent(address holder, uint256 propertyId)` view and `claimRent(uint256 propertyId)` with `nonReentrant` in `contracts/RentDistributor.sol` — calculate pending using formula, transfer USDC, update debt snapshot, emit `RentClaimed`
- [ ] T038 [US3] Implement `snapshotDebt(address from, address to, uint256 propertyId)` in `contracts/RentDistributor.sol` — settle pending rent for `from` before their balance changes; initialize debt for `to` at current accumulator value (prevents double-claiming)
- [ ] T039 [P] [US3] Create `frontend/hooks/useRentDistributor.ts` — export `useDepositRent()`, `useClaimRent()`, `useClaimRentBatch()`, `usePendingRent(holder, propertyId)` using Wagmi v2 `useWriteContract` and `useReadContract`
- [ ] T040 [US3] Add rent deposit section to `frontend/app/properties/[id]/page.tsx` — visible only to property owner; USDC amount input; `<TxButton>` calling `useDepositRent()`
- [ ] T041 [US3] Add pending rent display and claim button to `frontend/app/dashboard/page.tsx` (partial — full dashboard in US6)

**Checkpoint**: `npx hardhat test test/RentDistributor.test.ts` passes. Deposit rent → holders accumulate → claim → balance correct. US3 independently testable.

---

## Phase 6: User Story 4 — KYC Identity Verification (Priority: P4)

**Goal**: Admin issues soulbound KYC badge to verified investors. Badge cannot be transferred. `isVerified(wallet)` returns true.

**Independent Test**: Issue badge to investor wallet → `isVerified()` = true → attempt transfer → reverted. Revoke → `isVerified()` = false.

### Tests for User Story 4 (TDD — write RED first)

- [ ] T042 [P] [US4] Write `test/KYCBadge.test.ts` — test `issueBadge()`: emits `BadgeIssued`, `isVerified()` true, only KYC_ADMIN_ROLE can issue; test soulbound: transfer attempt reverts with `NonTransferable`; test duplicate: second issueBadge to same wallet reverts `AlreadyHasBadge`; test `revokeBadge()`: `isVerified()` becomes false (must FAIL before T043)

### Implementation for User Story 4

- [ ] T043 [US4] Create `contracts/KYCBadge.sol` — inherit `ERC721`, `AccessControl`; define `KYC_ADMIN_ROLE`; state: `mapping(address => uint256) holderToBadge`, `mapping(uint256 => bool) revoked`, `uint256 _tokenIdCounter`; grant admin role to deployer in constructor
- [ ] T044 [US4] Implement soulbound override `_update(address from, address to, uint256 tokenId)` in `contracts/KYCBadge.sol` — `if (from != address(0)) revert NonTransferable()` before `super._update()`
- [ ] T045 [US4] Implement `issueBadge(address to)`, `revokeBadge(address holder)`, `isVerified(address wallet)`, `getBadgeId(address wallet)` in `contracts/KYCBadge.sol` with role guards and emit events
- [ ] T046 [P] [US4] Create `frontend/hooks/useKYCBadge.ts` — export `useIsVerified(address)` using `useReadContract`, `useIssueBadge()` using `useWriteContract` (admin only)
- [ ] T047 [US4] Add KYC verification status indicator to `frontend/components/ui/Navbar.tsx` — green badge if `isVerified(connectedWallet)` else yellow "Unverified" chip with link to KYC info page

**Checkpoint**: `npx hardhat test test/KYCBadge.test.ts` passes. Transfer attempt reverts. US4 independently testable.

---

## Phase 7: User Story 5 — Secondary Marketplace (Priority: P5)

**Goal**: Token holders list their tokens for sale. Buyers purchase listed tokens. Sellers can cancel listings. All listings visible to everyone.

**Independent Test**: Holder lists 50 tokens at $15 each. Buyer purchases → tokens transfer to buyer, USDC to seller. Listing status = Sold.

### Tests for User Story 5 (TDD — write RED first)

- [ ] T048 [P] [US5] Write `test/Marketplace.test.ts` — test `createListing()`: emits `ListingCreated`, listing stored correctly; test `buyListing()`: atomic token+USDC swap, emits `ListingFulfilled`, status = Sold; test `cancelListing()`: only seller can cancel, tokens remain in seller wallet, emits `ListingCancelled`; test edge cases: self-purchase reverts, buying sold listing reverts (must FAIL before T049)

### Implementation for User Story 5

- [ ] T049 [US5] Create `contracts/Marketplace.sol` — inherit `ReentrancyGuard`, `Ownable`; state: `mapping(uint256 => Listing) public listings`, `uint256 public listingCounter`; constructor takes `IPropertyRegistry registry`, `IERC20 usdc`
- [ ] T050 [US5] Implement `createListing(uint256 propertyId, uint256 amount, uint256 pricePerToken)` in `contracts/Marketplace.sol` — check `registry.isApprovedForAll(seller, address(this))`, validate amount <= balance, store listing, increment counter, emit `ListingCreated`
- [ ] T051 [US5] Implement `buyListing(uint256 listingId)` with `nonReentrant` in `contracts/Marketplace.sol` — check Active status, prevent self-purchase, call `usdc.safeTransferFrom(buyer, seller, totalCost)`, call `registry.safeTransferFrom(seller, buyer, propertyId, amount, "")`, set status Sold, emit `ListingFulfilled`
- [ ] T052 [US5] Implement `cancelListing(uint256 listingId)` in `contracts/Marketplace.sol` — only seller, only Active, set status Cancelled, emit `ListingCancelled`
- [ ] T053 [P] [US5] Create `frontend/hooks/useMarketplace.ts` — export `useCreateListing()`, `useBuyListing()`, `useCancelListing()`, `useGetActiveListings(propertyId)` using Wagmi v2 hooks
- [ ] T054 [P] [US5] Create `frontend/components/marketplace/ListingCard.tsx` — display seller, property name, amount, price per token, total cost; Buy button (calls `useBuyListing`); Cancel button (visible only to listing owner)
- [ ] T055 [P] [US5] Create `frontend/components/marketplace/CreateListingModal.tsx` — modal form for propertyId, amount, pricePerToken; requires `setApprovalForAll` pre-step; calls `useCreateListing()`
- [ ] T056 [US5] Create `frontend/app/marketplace/page.tsx` — fetch all active listings from The Graph (`lib/graph.ts`), render `<ListingCard />` grid, floating `<CreateListingModal />` trigger button

**Checkpoint**: `npx hardhat test test/Marketplace.test.ts` passes. Full buy/sell flow works. US5 independently testable.

---

## Phase 8: User Story 6 — Portfolio Dashboard (Priority: P6)

**Goal**: Connected user sees all holdings, total portfolio value, pending rent per property, and full rent claim history in one view.

**Independent Test**: Connect wallet with holdings from US1–US5 → dashboard shows correct token quantities, USDC values, claimable rent, and past claim history.

### Implementation for User Story 6

- [ ] T057 [P] [US6] Create `frontend/lib/graph.ts` — GraphQL query functions: `getPropertiesByOwner(address)`, `getHoldingsByHolder(address)`, `getActiveListings(propertyId?)`, `getRentHistory(holder, propertyId?)`, `getPropertyById(id)` using The Graph subgraph URL from env
- [ ] T058 [P] [US6] Create `frontend/components/dashboard/PortfolioTable.tsx` — table rows: property name, tokens held, current price, estimated value, pending rent (from `usePendingRent`), Claim button per row calling `useClaimRent()`
- [ ] T059 [P] [US6] Create `frontend/components/dashboard/RentHistory.tsx` — chronological list of past `RentClaim` events from The Graph: date, property name, USDC amount, tx hash link
- [ ] T060 [US6] Create `frontend/app/dashboard/page.tsx` — wallet connection guard, fetch holdings + rent history via `lib/graph.ts`, render `<PortfolioTable />` and `<RentHistory />`, show total portfolio value and total rent earned summary cards

**Checkpoint**: Dashboard shows accurate data for a wallet with holdings across multiple properties. US6 independently testable.

---

## Phase 9: The Graph Subgraph

**Purpose**: Index all contract events for efficient frontend queries.

- [ ] T061 Create `subgraph/schema.graphql` with entities: `Property`, `Holding`, `Listing`, `RentDistribution`, `RentClaim`, `KYCBadge` — as defined in `specs/001-rwa-platform/data-model.md`
- [ ] T062 Create `subgraph/subgraph.yaml` — data sources for PropertyRegistry, RentDistributor, Marketplace, KYCBadge with all event handlers mapped; use deployed Sepolia contract addresses
- [ ] T063 [P] Create `subgraph/src/mappings/registry.ts` — handlers for `PropertyListed` (create Property entity) and `TokensPurchased` (update Holding entity)
- [ ] T064 [P] Create `subgraph/src/mappings/rentDistributor.ts` — handlers for `RentDeposited` (create RentDistribution entity) and `RentClaimed` (create RentClaim entity, update Holding.totalRentClaimed)
- [ ] T065 [P] Create `subgraph/src/mappings/marketplace.ts` — handlers for `ListingCreated`, `ListingFulfilled` (update Holding ownership), `ListingCancelled`
- [ ] T066 Run `graph codegen && graph build` — fix any schema/mapping errors
- [ ] T067 Deploy subgraph: `graph deploy --studio tokenestate` — copy query URL to `.env`

---

## Phase 10: Deployment

**Purpose**: Ship to Sepolia testnet + Vercel.

- [ ] T068 Create `ignition/modules/TokenEstateModule.ts` — Hardhat Ignition module deploying MockUSDC → KYCBadge → PropertyRegistry(usdc) → RentDistributor(usdc, registry) → Marketplace(usdc, registry) → call `registry.setRentDistributor(rentDistributor)`
- [ ] T069 Run deployment: `npx hardhat ignition deploy ignition/modules/TokenEstateModule.ts --network sepolia --verify` — copy all 5 contract addresses to `.env`
- [ ] T070 [P] Update `frontend/.env.local` with all `NEXT_PUBLIC_*` contract addresses from T069 and subgraph URL from T067
- [ ] T071 Run `cd frontend && npm run build` — must complete with zero TypeScript errors
- [ ] T072 Deploy frontend to Vercel: `vercel deploy --prod` — copy production URL

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T073 [P] Create landing page `frontend/app/page.tsx` — hero section "Invest in Real Estate with Crypto", feature cards for tokenization/rent/marketplace, CTA to /properties, dark neon Tailwind theme
- [ ] T074 [P] Run full test suite with coverage: `npx hardhat coverage` — must show ≥ 90% branch coverage on all 4 contracts; fix any gaps
- [ ] T075 [P] Gas report validation: `REPORT_GAS=true npx hardhat test` — confirm mint ≤ 150k gas, transfer ≤ 80k gas, claimRent ≤ 100k gas; optimize if over budget
- [ ] T076 [P] Write Playwright E2E test `frontend/e2e/full-journey.spec.ts` — wallet connect (mock) → list property → purchase tokens → deposit rent → claim rent → create marketplace listing → buy listing → check dashboard
- [ ] T077 [P] Verify all 5 contracts on Sepolia Etherscan — confirm source code visible and ABI downloadable
- [ ] T078 Add `README.md` to `tokenestate/` with: project overview, tech stack, local setup (points to quickstart.md), live demo link, contract addresses, subgraph URL

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately, all T001–T008 in parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks ALL user story phases
- **Phase 3 (US1)**: Requires Phase 2 complete
- **Phase 4 (US2)**: Requires Phase 3 complete (purchaseTokens depends on listProperty)
- **Phase 5 (US3)**: Requires Phase 2 complete (can parallel with Phase 3 on contract layer)
- **Phase 6 (US4)**: Requires Phase 2 complete (fully independent contract)
- **Phase 7 (US5)**: Requires Phase 4 complete (marketplace needs tokens to exist)
- **Phase 8 (US6)**: Requires Phases 3–7 complete (dashboard aggregates all stories)
- **Phase 9 (Subgraph)**: Requires Phase 10 Step 1 (needs deployed contract addresses)
- **Phase 10 (Deploy)**: Requires Phases 2–8 and all tests green
- **Phase 11 (Polish)**: Requires Phase 10 complete

### Within Each User Story

1. Write tests → confirm RED (fail) → implement → confirm GREEN → commit
2. Contracts before frontend hooks
3. Hooks before components
4. Components before pages

### Parallel Opportunities

```bash
# Phase 1 — all parallel:
T001 & T002 & T003 & T004 & T005 & T006 & T007 & T008

# Phase 2 — mostly parallel:
T009 + T010 (MockUSDC) | T011 | T012 | T013 | T014 | T015 | T016

# Phase 3 + Phase 5 (US1 + US3 contracts — independent files):
T017/T018/T019/T020/T021 (PropertyRegistry)  |  T034/T035/T036/T037/T038 (RentDistributor)

# Phase 6 (US4 — fully independent of US1-US3):
T042/T043/T044/T045 (KYCBadge) — can run in parallel with Phase 3
```

---

## Implementation Strategy

### MVP (User Story 1 + 2 only — minimum viable demo)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — Property Tokenization
4. Complete Phase 4: US2 — Fractional Investment
5. **STOP and VALIDATE**: List a property, buy tokens, verify on Etherscan
6. Demo-ready: property listing + purchase flow live on Sepolia

### Full Platform (All 6 Stories)

Add US3 (Rent) → US4 (KYC) → US5 (Marketplace) → US6 (Dashboard) → Deploy → Polish

---

## Summary

| Phase | Tasks | Story | Key Deliverable |
|-------|-------|-------|-----------------|
| 1 Setup | T001–T008 | — | Project scaffolding |
| 2 Foundational | T009–T016 | — | MockUSDC + providers |
| 3 US1 P1 | T017–T027 | US1 | List property + IPFS |
| 4 US2 P2 | T028–T033 | US2 | Buy fractional tokens |
| 5 US3 P3 | T034–T041 | US3 | Rent deposit + claim |
| 6 US4 P4 | T042–T047 | US4 | Soulbound KYC badge |
| 7 US5 P5 | T048–T056 | US5 | Secondary marketplace |
| 8 US6 P6 | T057–T060 | US6 | Portfolio dashboard |
| 9 Subgraph | T061–T067 | — | The Graph indexing |
| 10 Deploy | T068–T072 | — | Sepolia + Vercel live |
| 11 Polish | T073–T078 | — | Tests, gas, E2E, README |

**Total: 78 tasks | MVP: T001–T033 (33 tasks) | Parallel opportunities: ~40 tasks**
