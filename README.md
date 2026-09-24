# TokenEstate — RWA Real Estate Tokenization Platform

Fractional real estate ownership on Ethereum. Buy property tokens with USDC, earn rent automatically, trade on secondary market.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24 + OpenZeppelin 5.x |
| Token Standard | ERC-1155 (fractional shares) |
| Payments | USDC (ERC-20, 6 decimals) |
| Frontend | Next.js 15 App Router + TypeScript |
| Wallet | Wagmi v2 + RainbowKit v2 + Viem |
| Storage | IPFS via Pinata |
| Indexing | The Graph Protocol |
| Testnet | Ethereum Sepolia |
| Deploy | Vercel (frontend) + Hardhat Ignition (contracts) |

## Contracts

| Contract | Description |
|----------|-------------|
| `PropertyRegistry` | ERC-1155 — list properties, mint fractional tokens, purchase. Only a wallet with an active KYC badge can receive tokens |
| `RentDistributor` | Pull accumulator rent distribution (O(1) per claim). The owner pays in only the sold tokens' share |
| `KYCBadge` | Soulbound ERC-721 — non-transferable KYC identity token, checked on every token transfer |
| `Marketplace` | Escrow-free secondary market — atomic USDC + token swap |
| `MockUSDC` | Testnet USDC with public mint |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill keys
cp .env.example .env

# 3. Run tests
npm test

# 4. Deploy to Sepolia
npm run deploy:sepolia
```

## Environment Variables

```env
ALCHEMY_RPC_URL=          # Alchemy Sepolia RPC
SEPOLIA_PRIVATE_KEY=      # Deployer wallet private key
ETHERSCAN_API_KEY=        # For contract verification

NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS=
NEXT_PUBLIC_RENT_DISTRIBUTOR_ADDRESS=
NEXT_PUBLIC_MARKETPLACE_ADDRESS=
NEXT_PUBLIC_KYC_BADGE_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_GRAPH_URL=    # The Graph subgraph URL
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

PINATA_API_KEY=
PINATA_SECRET_KEY=
```

## Rules the contracts enforce

- **KYC:** `PropertyRegistry` checks `KYCBadge.isVerified` on every transfer, so a wallet without an
  active badge cannot buy in the primary sale, buy on the Marketplace or be sent tokens (`NotKYCVerified`).
  A revoked badge stops new purchases; a holder can still sell to a verified buyer.
- **Rent:** rent is earned per token. Unsold tokens belong to the owner, so `depositRent(amount)` takes
  `amount` as the rent for the whole property but collects only the share of the tokens investors hold
  (`RentDeposited` reports that collected amount). Nothing is left stuck in the contract, and rent
  cannot be deposited before a token is sold (`NoTokenHolders`).

## Test Results

```
71 passing
  MockUSDC                      8 tests
  PropertyRegistry             15 tests
  RentDistributor              10 tests
  RentDistributor (transfers)   3 tests
  RentDistributor (unsold)      4 tests
  KYCBadge                     12 tests
  KYC enforcement               6 tests
  Marketplace                  13 tests
```

## Project Structure

```
tokenestate/
├── contracts/          # Solidity smart contracts
├── test/               # Hardhat tests (TDD)
├── ignition/           # Deployment modules
├── frontend/           # Next.js 15 app
│   ├── app/            # Pages (App Router)
│   ├── components/     # UI components
│   ├── hooks/          # Wagmi hooks
│   └── lib/            # graph.ts, ipfs.ts, contracts.ts
└── subgraph/           # The Graph indexer
```

## Deploy Frontend

```bash
cd frontend
npm install
npm run build
vercel --prod
```

Built with SpecKit Plus SDD pipeline · Muhammad Yaseen 2026
