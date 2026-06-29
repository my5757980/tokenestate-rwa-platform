---
id: 004
title: TokenEstate RWA Platform Tasks
stage: tasks
date: 2026-06-27
surface: agent
model: claude-sonnet-4-6
feature: 001-rwa-platform
branch: 001-rwa-platform
user: Muhammad Yaseen
command: /sp.tasks
labels: ["tasks","tdd","solidity","nextjs","wagmi","subgraph","tokenestate"]
links:
  spec: specs/001-rwa-platform/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-rwa-platform/tasks.md
tests:
  - test/PropertyRegistry.test.ts
  - test/RentDistributor.test.ts
  - test/KYCBadge.test.ts
  - test/Marketplace.test.ts
  - frontend/e2e/full-journey.spec.ts
---

## Prompt

001-rwa-platform — TokenEstate RWA Platform. Generate tasks from specs/001-rwa-platform/spec.md,
plan.md, data-model.md, contracts/. TDD order: tests RED first, then implementation. 5 contracts:
PropertyRegistry, RentDistributor, KYCBadge, Marketplace, MockUSDC. Frontend: Next.js 15 App Router,
Wagmi v2, RainbowKit, The Graph subgraph. Deploy: Hardhat Ignition to Sepolia, Vercel frontend.

## Response snapshot

Generated 78 tasks across 11 phases in TDD order. All tasks follow [ID] [P?] [Story?] format
with exact file paths. US1-US6 mapped to Phases 3-8 independently. Test tasks marked RED-first
before each implementation block. ~40 tasks parallelizable. MVP = 33 tasks (US1+US2 only).

## Outcome

- Impact: Full task list ready — immediately executable by agent or developer
- Tests: 4 contract test files + 1 Playwright E2E planned, written RED before implementation
- Files: specs/001-rwa-platform/tasks.md (78 tasks)
- Next prompts: /sp.implement — execute tasks starting from T001
- Reflection: Pull rent accumulator (T034-T038) is the most complex task sequence

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): all tasks have IDs, file paths, story labels — PASS
- Prompt variant (if applicable): initial
- Next experiment: /sp.implement to execute T001 onwards
