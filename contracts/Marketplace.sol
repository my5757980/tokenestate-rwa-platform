// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMarketplace.sol";
import "./interfaces/IPropertyRegistry.sol";

/// @title Marketplace — Escrow-free secondary market for fractional property tokens
/// @notice Seller pre-approves Marketplace via ERC-1155 setApprovalForAll.
///         buyListing atomically swaps USDC + tokens in one transaction.
contract Marketplace is IMarketplace, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── State ───────────────────────────────────────────────────────────────

    IPropertyRegistry public immutable registry;
    IERC20 public immutable usdc;

    uint256 private _listingCounter;
    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => uint256[]) private _propertyListings; // propertyId => listingIds

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _registry, address _usdc) Ownable(msg.sender) {
        registry = IPropertyRegistry(_registry);
        usdc = IERC20(_usdc);
    }

    // ─── US5: Secondary Marketplace ──────────────────────────────────────────

    function createListing(
        uint256 propertyId,
        uint256 amount,
        uint256 pricePerToken
    ) external returns (uint256 listingId) {
        if (amount == 0) revert InvalidAmount();
        if (pricePerToken == 0) revert InvalidPrice();
        if (registry.balanceOf(msg.sender, propertyId) < amount)
            revert InsufficientTokenBalance(msg.sender, propertyId);
        if (!registry.isApprovedForAll(msg.sender, address(this)))
            revert MarketplaceNotApproved(msg.sender);

        _listingCounter++;
        listingId = _listingCounter;

        _listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            propertyId: propertyId,
            amount: amount,
            pricePerToken: pricePerToken,
            status: ListingStatus.Active,
            createdAt: block.timestamp
        });

        _propertyListings[propertyId].push(listingId);
        emit ListingCreated(listingId, msg.sender, propertyId, amount, pricePerToken);
    }

    function buyListing(uint256 listingId) external nonReentrant {
        Listing storage l = _listings[listingId];
        if (l.status != ListingStatus.Active) revert ListingNotActive(listingId);
        if (l.seller == msg.sender) revert SelfPurchaseNotAllowed();

        uint256 totalCost = l.amount * l.pricePerToken;
        l.status = ListingStatus.Sold;

        // Atomic swap: USDC from buyer to seller, tokens from seller to buyer
        usdc.safeTransferFrom(msg.sender, l.seller, totalCost);
        registry.safeTransferFrom(l.seller, msg.sender, l.propertyId, l.amount, "");

        emit ListingFulfilled(listingId, msg.sender, totalCost);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage l = _listings[listingId];
        if (l.status != ListingStatus.Active) revert ListingNotActive(listingId);
        if (l.seller != msg.sender) revert NotListingSeller(listingId, msg.sender);

        l.status = ListingStatus.Cancelled;
        emit ListingCancelled(listingId, msg.sender);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return _listings[listingId];
    }

    function getActiveListings(uint256 propertyId) external view returns (uint256[] memory) {
        uint256[] storage all = _propertyListings[propertyId];
        uint256 count = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (_listings[all[i]].status == ListingStatus.Active) count++;
        }
        uint256[] memory active = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (_listings[all[i]].status == ListingStatus.Active) {
                active[idx++] = all[i];
            }
        }
        return active;
    }
}
