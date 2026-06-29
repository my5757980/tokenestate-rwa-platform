// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IKYCBadge
/// @notice Soulbound (non-transferable) KYC identity token for TokenEstate
interface IKYCBadge {

    // ─── Events ──────────────────────────────────────────────────────────────

    event BadgeIssued(address indexed holder, uint256 indexed tokenId);
    event BadgeRevoked(address indexed holder, uint256 indexed tokenId);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error AlreadyHasBadge(address holder);
    error NoBadgeFound(address holder);
    error BadgeAlreadyRevoked(address holder);
    error NonTransferable();

    // ─── Functions ───────────────────────────────────────────────────────────

    /// @notice Issue a KYC badge to a verified investor (KYC_ADMIN_ROLE only)
    /// @param to Investor wallet address
    function issueBadge(address to) external;

    /// @notice Revoke a KYC badge (KYC_ADMIN_ROLE only)
    /// @param holder Wallet whose badge is revoked
    function revokeBadge(address holder) external;

    /// @notice Check if a wallet holds an active (non-revoked) KYC badge
    /// @param wallet Address to check
    /// @return verified True if holder has an active badge
    function isVerified(address wallet) external view returns (bool verified);

    /// @notice Get badge token ID for a wallet (reverts if none)
    function getBadgeId(address wallet) external view returns (uint256 tokenId);
}
