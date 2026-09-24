// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRentDistributor
/// @notice Pull-pattern rent distribution for TokenEstate properties
interface IRentDistributor {

    // ─── Events ─────────────────────────────────────────────────────────────

    event RentDeposited(
        uint256 indexed propertyId,
        address indexed depositor,
        uint256 amount
    );

    event RentClaimed(
        uint256 indexed propertyId,
        address indexed claimer,
        uint256 amount
    );

    // ─── Errors ─────────────────────────────────────────────────────────────

    error NotPropertyOwner(uint256 propertyId, address caller);
    error ZeroRentAmount();
    error NothingToClaim(address claimer, uint256 propertyId);
    error ZeroTokenSupply(uint256 propertyId);
    error NoTokenHolders(uint256 propertyId);

    // ─── Functions ───────────────────────────────────────────────────────────

    /// @notice Property owner deposits USDC rent income
    /// @dev Only the share earned by tokens investors hold is collected; unsold tokens are the
    ///      owner's, so their share never leaves the owner. RentDeposited reports what was collected.
    /// @param propertyId Target property
    /// @param amount USDC rent for the whole property (6 decimals)
    function depositRent(uint256 propertyId, uint256 amount) external;

    /// @notice Token holder claims their accumulated rent
    /// @param propertyId Target property
    function claimRent(uint256 propertyId) external;

    /// @notice Claim rent from multiple properties in one tx
    /// @param propertyIds Array of property IDs to claim from
    function claimRentBatch(uint256[] calldata propertyIds) external;

    /// @notice View pending rent for a holder (does not mutate state)
    /// @param holder Investor wallet address
    /// @param propertyId Target property
    /// @return pending USDC amount claimable (6 decimals)
    function pendingRent(
        address holder,
        uint256 propertyId
    ) external view returns (uint256 pending);

    /// @notice Snapshot debt when token balance changes (called by PropertyRegistry)
    /// @dev Must be called on every ERC-1155 transfer
    function snapshotDebt(
        address from,
        address to,
        uint256 propertyId
    ) external;
}
