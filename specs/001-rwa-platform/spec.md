# Feature Specification: TokenEstate — RWA Real Estate Tokenization Platform

**Feature Branch**: `001-rwa-platform`
**Created**: 2026-06-27
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Property Tokenization (Priority: P1)

A property owner connects their wallet, fills in property details (name, location,
description, total value), uploads supporting documents, sets the number of tokens
and price per token, and submits the listing. The platform mints fractional ownership
tokens tied to that property, making them available for purchase by investors.

**Why this priority**: Without tokenized properties, the entire platform has nothing
to invest in. This is the foundational flow that enables every other feature.

**Independent Test**: A property owner can list a property and see it appear on the
platform with tokens available for purchase — without any investor interaction needed.

**Acceptance Scenarios**:

1. **Given** a wallet-connected property owner, **When** they submit a valid property
   listing with documents and token parameters, **Then** the property appears on the
   platform with the correct number of tokens available at the specified price.
2. **Given** a property owner submitting a listing, **When** required fields are
   missing, **Then** the form shows clear validation errors and submission is blocked.
3. **Given** a submitted property, **When** the tokenization is confirmed, **Then**
   the owner receives a confirmation and the property status shows "Active".

---

### User Story 2 — Fractional Investment (Priority: P2)

An investor connects their wallet, browses listed properties, selects how many tokens
to purchase, approves the payment amount in stablecoin, and completes the transaction.
Their fractional ownership is recorded and reflected in their portfolio immediately.

**Why this priority**: Investing is the core revenue-generating action for the
platform. Without it, property listings have no purpose.

**Independent Test**: An investor can purchase tokens for a listed property and see
their ownership reflected in their portfolio — independently verifiable against the
on-chain record.

**Acceptance Scenarios**:

1. **Given** an investor with sufficient stablecoin balance, **When** they purchase
   tokens for a listed property, **Then** their wallet reflects the acquired tokens
   and the property shows updated available supply.
2. **Given** an investor with insufficient balance, **When** they attempt a purchase,
   **Then** the transaction is blocked with a clear insufficient funds message.
3. **Given** a purchase in progress, **When** the investor cancels before confirmation,
   **Then** no tokens are transferred and no funds are deducted.

---

### User Story 3 — Rent Distribution (Priority: P3)

A property owner deposits monthly rental income into the platform. The system
automatically calculates each token holder's proportional share and distributes
the funds to all holders' wallets in a single operation, with a transparent
on-chain record of the distribution.

**Why this priority**: Rent distribution is the primary financial return mechanism
for investors — it differentiates TokenEstate from a simple NFT marketplace.

**Independent Test**: After a property owner deposits rent, all token holders see
their proportional income credited to their wallets — verifiable without any
marketplace or KYC dependency.

**Acceptance Scenarios**:

1. **Given** a property with multiple token holders, **When** the owner deposits
   rent income, **Then** each holder's wallet receives their exact proportional
   share within one blockchain transaction.
2. **Given** a rent distribution event, **When** it is complete, **Then** the
   platform shows a distribution history entry with timestamp, total amount, and
   per-holder breakdown.
3. **Given** a property with zero token holders besides the owner, **When** rent
   is deposited, **Then** the full amount remains with the owner and no distribution
   errors occur.

---

### User Story 4 — KYC Identity Verification (Priority: P4)

An investor submits identity verification documents through the platform. Upon
approval by the platform administrator, the investor receives a non-transferable
identity badge linked to their wallet. This badge may be required for certain
regulated property investments.

**Why this priority**: Regulatory compliance is mandatory for real-world asset
platforms. KYC protects the platform and its users.

**Independent Test**: A verified investor has a non-transferable identity badge
on their wallet that cannot be moved to another address.

**Acceptance Scenarios**:

1. **Given** an investor who submits valid KYC documents, **When** an admin approves
   the submission, **Then** a non-transferable identity badge is issued to their wallet.
2. **Given** a verified investor, **When** they attempt to transfer their identity
   badge to another wallet, **Then** the transfer is rejected by the platform.
3. **Given** a KYC rejection, **When** the admin denies a submission, **Then** the
   investor receives a notification with the reason and can resubmit.

---

### User Story 5 — Secondary Marketplace (Priority: P5)

A token holder lists their property tokens for sale at a chosen price. Other investors
browse available listings, purchase tokens directly from sellers, and take over
fractional ownership. The marketplace tracks all active listings and completed trades.

**Why this priority**: Liquidity is critical for investor confidence. The secondary
market lets investors exit positions without waiting for property sale.

**Independent Test**: A token holder can list tokens, another investor can purchase
them, and ownership transfers correctly — verifiable without any rent distribution
dependency.

**Acceptance Scenarios**:

1. **Given** a token holder, **When** they list tokens at a chosen price, **Then**
   the listing appears publicly and other investors can purchase it.
2. **Given** an active listing, **When** a buyer purchases the listed tokens, **Then**
   ownership transfers to the buyer and the seller receives payment.
3. **Given** an active listing, **When** the seller cancels it, **Then** the listing
   is removed and tokens return to the seller's portfolio.

---

### User Story 6 — Portfolio Dashboard (Priority: P6)

A user views a personalised dashboard showing all their property token holdings,
current market value, total rent income received, pending distributions, and
transaction history — all in one place without navigating multiple screens.

**Why this priority**: Dashboard is a quality-of-life feature. Core flows work
without it, but it is essential for user retention and LinkedIn demo appeal.

**Independent Test**: A user with existing holdings sees accurate portfolio data
on the dashboard — independently verifiable against on-chain records.

**Acceptance Scenarios**:

1. **Given** a wallet-connected user with holdings, **When** they open the dashboard,
   **Then** all current token holdings and total portfolio value are displayed.
2. **Given** a user who has received rent distributions, **When** they view income
   history, **Then** all past distributions are listed with dates and amounts.
3. **Given** a user with no holdings, **When** they open the dashboard, **Then** they
   see an empty state with a prompt to explore available properties.

---

### Edge Cases

- What happens when a property's all tokens are sold and then the owner tries to
  list more tokens? (system should prevent over-minting beyond original supply)
- How does rent distribution work if a token holder's wallet is a contract that
  cannot receive funds? (distribution should not block for all holders)
- What if a marketplace buyer's stablecoin approval expires before the transaction
  confirms? (clear re-approval prompt required)
- What happens if a KYC-verified user's badge is revoked after they already hold
  tokens in a regulated property? (tokens remain, future purchases in regulated
  properties blocked until re-verified)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow property owners to list a property by providing name,
  location, description, total valuation, total token supply, and price per token.
- **FR-002**: System MUST allow property owners to upload property documents, which
  are stored on decentralised storage and referenced in the property record.
- **FR-003**: System MUST mint fractional ownership tokens upon successful property
  listing, with the total supply matching the owner's specified token count.
- **FR-004**: System MUST allow investors to browse all active property listings with
  key details: name, location, available tokens, price per token, and total value.
- **FR-005**: System MUST allow investors to purchase fractional tokens by specifying
  a quantity and paying the equivalent amount in an accepted stablecoin.
- **FR-006**: System MUST validate investor stablecoin balance and approval before
  processing a purchase transaction.
- **FR-007**: System MUST allow property owners to deposit rental income for a
  specific property they own.
- **FR-008**: System MUST automatically calculate and distribute rent proportionally
  to all current token holders when a rent deposit is made.
- **FR-009**: System MUST record all rent distribution events with timestamp, property,
  total distributed amount, and per-holder amounts.
- **FR-010**: System MUST issue a non-transferable identity verification badge to
  investors whose KYC submission is approved by an admin.
- **FR-011**: System MUST prevent transfer of identity verification badges between wallets.
- **FR-012**: System MUST allow token holders to list their tokens for sale on the
  secondary marketplace at a self-chosen price.
- **FR-013**: System MUST allow investors to purchase tokens from secondary marketplace
  listings using an accepted stablecoin.
- **FR-014**: System MUST allow sellers to cancel their active marketplace listings
  and reclaim their tokens.
- **FR-015**: System MUST provide each user a portfolio view showing all token holdings,
  estimated value, total rent received, and transaction history.

### Key Entities

- **Property**: Represents a tokenized real estate asset. Attributes: unique ID,
  owner wallet, name, location, description, document reference (decentralised
  storage pointer), total token supply, tokens sold, price per token, total valuation,
  status (active / paused / sold out), rent balance.
- **PropertyToken**: Fractional ownership unit of a Property. Attributes: token ID,
  property reference, current holder wallet, quantity held.
- **IdentityBadge**: Non-transferable proof of KYC verification. Attributes: badge ID,
  holder wallet, issue date, status (active / revoked), issuing admin.
- **MarketplaceListing**: An offer to sell PropertyTokens. Attributes: listing ID,
  seller wallet, token reference, quantity listed, price per token, status
  (active / sold / cancelled), creation date.
- **RentDistribution**: Record of a rent income event. Attributes: distribution ID,
  property reference, total amount, timestamp, list of (holder wallet, amount) pairs.
- **UserPortfolio**: Aggregated view of a user's holdings, rent income, and trade
  history (derived from on-chain data, not stored separately).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Property owners can complete a full property tokenization in under
  5 minutes from wallet connection to tokens being available for purchase.
- **SC-002**: Investors can purchase fractional tokens in under 2 minutes from
  browsing a property to confirmed ownership in their portfolio.
- **SC-003**: Rent distribution to all token holders completes in a single atomic
  operation — no partial distributions possible.
- **SC-004**: Identity verification badges are issued within 24 hours of a complete
  and valid KYC submission.
- **SC-005**: Secondary marketplace listings appear to all platform users within
  30 seconds of a seller creating them.
- **SC-006**: Portfolio dashboard reflects accurate holdings and income history
  with no more than a 60-second data delay after any on-chain event.
- **SC-007**: Zero instances of tokens being minted beyond the specified supply cap
  for any property.
- **SC-008**: Zero successful transfers of identity verification badges between wallets.

## Assumptions

- Stablecoin used for all payments is USDC (or equivalent testnet stablecoin for demo).
- KYC approval is performed manually by a platform admin in the initial version;
  automated third-party KYC integration is out of scope for v1.
- Property documents are uploaded by owners in PDF or image format (max 10 MB each).
- Rent income is deposited in the same stablecoin used for purchases.
- Platform is deployed on Ethereum Sepolia testnet for demo; mainnet deployment
  is a future phase.
- The platform does not provide legal or investment advice; disclaimer shown to users.
- All monetary values displayed in USD equivalent based on stablecoin peg.
