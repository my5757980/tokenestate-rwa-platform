// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IMarketplace
/// @notice Secondary market for TokenEstate fractional property tokens
interface IMarketplace {

    // ─── Enums ───────────────────────────────────────────────────────────────

    enum ListingStatus { Active, Sold, Cancelled }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Listing {
        uint256       id;
        address       seller;
        uint256       propertyId;
        uint256       amount;
        uint256       pricePerToken;  // USDC (6 decimals)
        ListingStatus status;
        uint256       createdAt;
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed propertyId,
        uint256 amount,
        uint256 pricePerToken
    );

    event ListingFulfilled(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 totalCost
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error ListingNotActive(uint256 listingId);
    error NotListingSeller(uint256 listingId, address caller);
    error InsufficientTokenBalance(address seller, uint256 propertyId);
    error MarketplaceNotApproved(address seller);
    error InvalidAmount();
    error InvalidPrice();
    error SelfPurchaseNotAllowed();

    // ─── Functions ───────────────────────────────────────────────────────────

    /// @notice Create a new listing to sell fractional tokens
    /// @param propertyId Property whose tokens are being listed
    /// @param amount Number of tokens to sell
    /// @param pricePerToken USDC price per token (6 decimals)
    /// @return listingId The new listing ID
    function createListing(
        uint256 propertyId,
        uint256 amount,
        uint256 pricePerToken
    ) external returns (uint256 listingId);

    /// @notice Purchase tokens from an active listing
    /// @param listingId Target listing
    function buyListing(uint256 listingId) external;

    /// @notice Cancel an active listing and reclaim tokens
    /// @param listingId Target listing (must be caller's listing)
    function cancelListing(uint256 listingId) external;

    /// @notice Get listing details
    function getListing(uint256 listingId) external view returns (Listing memory);

    /// @notice Get all active listing IDs for a property
    function getActiveListings(
        uint256 propertyId
    ) external view returns (uint256[] memory listingIds);
}
