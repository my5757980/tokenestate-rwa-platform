---
id: 002
title: TokenEstate RWA Platform Spec
stage: spec
date: 2026-06-27
surface: agent
model: claude-sonnet-4-6
feature: 001-rwa-platform
branch: 001-rwa-platform
user: Muhammad Yaseen
command: /sp.specify
labels: ["spec","rwa","blockchain","real-estate","fractional-ownership","tokenestate"]
links:
  spec: specs/001-rwa-platform/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-rwa-platform/spec.md
  - specs/001-rwa-platform/checklists/requirements.md
tests:
  - null
---

## Prompt

TokenEstate — RWA Real Estate Tokenization Platform on Ethereum.

Platform jisme property owners apni real estate ko ERC-1155 tokens mein tokenize kar sakein. Investors fractional ownership khareed sakein USDC se. Rent automatically smart contract ke through distribute ho. KYC verification ke liye Soulbound Token (SBT). Secondary marketplace jahan tokens buy/sell ho sakein.

Core features:
1. Property Listing — owner property details + IPFS documents upload kare, tokens mint ho
2. Fractional Investment — koi bhi wallet connect kare aur USDC se tokens khareed le
3. Rent Distribution — property owner monthly rent deposit kare, smart contract sab token holders mein divide kare
4. KYC/Identity — SBT (non-transferable NFT) verified users ko mile
5. Marketplace — token holders apne shares list karein aur doosre khareedein
6. Dashboard — har user ka portfolio, rent income, holdings dekhe

Tech: Solidity + OpenZeppelin, Hardhat, Next.js 15, Wagmi v2, RainbowKit, IPFS/Pinata, The Graph, Sepolia testnet, Vercel deploy

## Response snapshot

Created full feature specification at `specs/001-rwa-platform/spec.md` on branch `001-rwa-platform`.
6 user stories (P1–P6): Property Tokenization, Fractional Investment, Rent Distribution,
KYC Verification, Secondary Marketplace, Portfolio Dashboard.
15 Functional Requirements (FR-001 to FR-015), 6 Key Entities, 8 Success Criteria (SC-001 to SC-008).
Edge cases documented. Assumptions section covers USDC, manual KYC v1, Sepolia testnet scope.
Quality checklist created — all items pass. No NEEDS CLARIFICATION markers.

## Outcome

- ✅ Impact: Full business-level spec created — technology-agnostic, user-focused, testable
- 🧪 Tests: No tests at spec stage
- 📁 Files: specs/001-rwa-platform/spec.md, specs/001-rwa-platform/checklists/requirements.md
- 🔁 Next prompts: /sp.plan — generate architecture and implementation plan
- 🧠 Reflection: All 6 core features mapped to independent user stories with clear acceptance criteria

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): all checklist items PASS
- Prompt variant (if applicable): initial
- Next experiment: /sp.plan to define contracts, folder structure, and phase plan
