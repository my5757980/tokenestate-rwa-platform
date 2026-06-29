# QuickStart: TokenEstate Development

**Branch**: `001-rwa-platform` | **Date**: 2026-06-27

## Prerequisites

- Node.js 20+
- npm 10+
- MetaMask browser extension
- Alchemy account (free tier)
- Pinata account (free tier)
- The Graph CLI (`npm install -g @graphprotocol/graph-cli`)

## 1. Clone & Install

```bash
git clone <repo-url>
cd tokenestate
npm install          # root — Hardhat workspace
cd frontend && npm install
cd ../subgraph && npm install
```

## 2. Environment Variables

```bash
cp .env.example .env
```

Fill in `.env`:
```
# Hardhat / Contracts
ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your-key>
SEPOLIA_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...

# Frontend (prefix NEXT_PUBLIC_ for browser access)
NEXT_PUBLIC_ALCHEMY_ID=<your-alchemy-id>
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<from cloud.walletconnect.com>
NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS=
NEXT_PUBLIC_RENT_DISTRIBUTOR_ADDRESS=
NEXT_PUBLIC_MARKETPLACE_ADDRESS=
NEXT_PUBLIC_KYC_BADGE_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_GRAPH_URL=

# IPFS / Pinata
PINATA_API_KEY=
PINATA_SECRET_KEY=
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

## 3. Compile & Test Contracts

```bash
# Compile
npx hardhat compile

# Run all tests
npx hardhat test

# Coverage report
npx hardhat coverage

# Gas report
REPORT_GAS=true npx hardhat test
```

Expected: ≥ 90% branch coverage, all tests green.

## 4. Deploy to Sepolia

```bash
npx hardhat ignition deploy ignition/modules/TokenEstateModule.ts \
  --network sepolia \
  --verify
```

Copy deployed addresses into `.env` (`NEXT_PUBLIC_*_ADDRESS` fields).

## 5. Deploy Subgraph

```bash
cd subgraph
graph auth --studio <deploy-key>
graph codegen && graph build
graph deploy --studio tokenestate
```

Copy the subgraph query URL into `.env` (`NEXT_PUBLIC_GRAPH_URL`).

## 6. Run Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. Connect MetaMask to Sepolia.

## 7. Validation Checklist

- [ ] MetaMask connects and shows Sepolia network
- [ ] `/list-property` — upload a test property, see it on `/properties`
- [ ] `/properties/[id]` — purchase 5 tokens with test USDC
- [ ] `/dashboard` — see holdings and pending rent
- [ ] Deposit rent as property owner, claim as investor
- [ ] Create a marketplace listing and buy it from a second wallet
- [ ] Verify KYC badge is non-transferable (attempt transfer → rejected)
- [ ] All contracts verified on Sepolia Etherscan

## 8. Test USDC Faucet (Sepolia)

The `MockUSDC.sol` contract has a public `mint(address, amount)` function for
testnet. Call it from the frontend dev tools or Hardhat console:

```typescript
const usdc = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);
await usdc.mint(yourWallet, 10_000_000_000n); // 10,000 USDC (6 decimals)
```
