---
id: 001
title: TokenEstate Constitution Init
stage: constitution
date: 2026-06-27
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Muhammad Yaseen
command: /sp.constitution
labels: ["constitution","web3","blockchain","rwa","ethereum","tokenestate"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - null
---

## Prompt

TokenEstate — RWA Real Estate Tokenization Platform on Ethereum. Tech stack: Solidity + OpenZeppelin (ERC-1155, ERC-20 USDC), Hardhat, Next.js 15 App Router, Tailwind CSS, Wagmi v2, Viem, RainbowKit, IPFS/Pinata, The Graph, TypeScript. Deploy: Sepolia testnet (contracts), Vercel (frontend). Core principles: security-first smart contracts, type-safe TypeScript, modular architecture, gas optimization, full test coverage with Hardhat.

## Response snapshot

Created TokenEstate Constitution v1.0.0 at `.specify/memory/constitution.md` with 6 core principles:
I. Security-First Smart Contracts — OpenZeppelin, ReentrancyGuard, no custom crypto, Etherscan verify.
II. Type-Safe TypeScript — strict mode, no `any`, typechain ABI generation.
III. Test-First Development — Hardhat TDD, ≥90% branch coverage, Playwright E2E.
IV. Gas Optimization — benchmarked per function, typed storage, batch ops, gas budgets defined.
V. Modular Architecture — contracts/frontend/subgraph layers independent, feature-based folder structure.
VI. Decentralized Storage & Indexing — IPFS/Pinata for all metadata, The Graph for event indexing.
Tech Stack Standards and Development Workflow sections also defined. Governance with ADR-based amendment procedure.

## Outcome

- ✅ Impact: Project constitution established — all future specs, plans, and tasks must comply
- 🧪 Tests: No tests at constitution stage
- 📁 Files: .specify/memory/constitution.md (created/overwritten)
- 🔁 Next prompts: /sp.specify — create feature spec for TokenEstate core platform
- 🧠 Reflection: Constitution covers all 6 critical areas for a Web3 RWA project in 2026

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): no placeholders remaining — PASS
- Prompt variant (if applicable): initial
- Next experiment: run /sp.specify with full TokenEstate feature description
