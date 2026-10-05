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
| Indexing | The Graph subgraph, hosted on Goldsky |
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

## Live contracts (Sepolia)

Deployed on 4 Oct 2026 from a fresh deployer, `0x09630cd4430a5ad1122f04A5eD5135c67f3A9e49`. The first block is 11843049.

| Contract | Address |
|---|---|
| PropertyRegistry | [`0x0970bb32A1F21a94DF5Bb23f37f180f5EEd8f5E9`](https://sepolia.etherscan.io/address/0x0970bb32A1F21a94DF5Bb23f37f180f5EEd8f5E9) |
| RentDistributor | [`0xfCC46865f53fb17f78ea885E43B07E2848298c97`](https://sepolia.etherscan.io/address/0xfCC46865f53fb17f78ea885E43B07E2848298c97) |
| Marketplace | [`0x33BB456DfA41FA4b1D9a3Cfc2CA66588E260d340`](https://sepolia.etherscan.io/address/0x33BB456DfA41FA4b1D9a3Cfc2CA66588E260d340) |
| KYCBadge | [`0x4149C0d1Dc520ce4b8EcE0ee212b64c9369F776C`](https://sepolia.etherscan.io/address/0x4149C0d1Dc520ce4b8EcE0ee212b64c9369F776C) |
| MockUSDC | [`0xcc5Af8412f3c2951630Aeeafeb8b70E4B0BC9ac3`](https://sepolia.etherscan.io/address/0xcc5Af8412f3c2951630Aeeafeb8b70E4B0BC9ac3) |

These contracts carry the KYC and rent rules below.

The subgraph that indexes them is hosted on Goldsky:
`https://api.goldsky.com/api/public/project_cmuuyllx0m36n01uaa40kf6qt/subgraphs/tokenestate/1.0.0/gn`.
To redeploy it, run `goldsky subgraph deploy tokenestate/<version> --path .` in `subgraph/` after `graph build`.

**Demo data:** the live contracts hold three demo listings. They are not real offers.
- Marina Heights, Clifton Villa and Gulberg Plaza.
- Their images are drawn for the demo and pinned to IPFS through the site's own `/api/ipfs`.

`scripts/seed-demo.ts` created them on 5 Oct 2026, and it also runs every user flow once on Sepolia, checking balances after each step:
- KYC badges
- a primary purchase
- a rent deposit and claim (no double claim)
- a marketplace sale
- one marketplace listing left open

Re-running it repeats the purchases and the rent, but not the listings.

**Retired deployment:** the earlier Sepolia contracts (PropertyRegistry `0x0f5DaC…5252` and the others) should not be used.
- They predate those fixes.
- Their deployer key was committed to this repo.

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
NEXT_PUBLIC_GRAPH_URL=    # subgraph GraphQL URL (Goldsky)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_SEPOLIA_RPC_URL=  # optional: RPC the site reads through (else the rate-limited public one)

PINATA_API_KEY=           # server-side only: used by the /api/ipfs upload route
PINATA_SECRET_KEY=
```

The browser never sees the Pinata keys: listing a property uploads through `/api/ipfs`, which accepts
PDF, JPEG or PNG documents up to 10 MB. The route is open to anyone who can reach the site, so put rate
limiting in front of it before a public launch.

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
└── subgraph/           # The Graph subgraph (deployed to Goldsky)
```

## Deploy Frontend

```bash
cd frontend
npm install
npm run build
vercel --prod
```

Built with SpecKit Plus SDD pipeline · Muhammad Yaseen 2026
