// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/// @title IPropertyRegistry
/// @notice Interface for the TokenEstate property tokenization registry
interface IPropertyRegistry is IERC1155 {

    // ─── Structs ────────────────────────────────────────────────────────────

    struct Property {
        uint256 id;
        address owner;
        string  metadataCID;    // IPFS CID
        uint256 totalSupply;    // total fractional tokens
        uint256 pricePerToken;  // USDC (6 decimals)
        uint256 tokensSold;
        bool    active;
    }

    // ─── Events ─────────────────────────────────────────────────────────────

    event PropertyListed(
        uint256 indexed propertyId,
        address indexed owner,
        string  metadataCID,
        uint256 totalSupply,
        uint256 pricePerToken
    );

    event TokensPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost
    );

    event PropertyPaused(uint256 indexed propertyId);
    event PropertyUnpaused(uint256 indexed propertyId);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error PropertyNotActive(uint256 propertyId);
    error InsufficientTokensAvailable(uint256 available, uint256 requested);
    error NotPropertyOwner(uint256 propertyId, address caller);
    error InvalidTokenAmount();
    error InvalidPrice();
    error EmptyMetadataCID();

    // ─── Functions ───────────────────────────────────────────────────────────

    /// @notice List a new property and mint fractional tokens
    /// @param metadataCID IPFS CID of property metadata JSON
    /// @param totalSupply Number of fractional tokens to mint (e.g. 1000)
    /// @param pricePerToken Price in USDC (6 decimals) per token
    /// @return propertyId The new property's unique ID (also the ERC-1155 tokenId)
    function listProperty(
        string calldata metadataCID,
        uint256 totalSupply,
        uint256 pricePerToken
    ) external returns (uint256 propertyId);

    /// @notice Purchase fractional tokens for a property
    /// @param propertyId Target property
    /// @param amount Number of tokens to purchase
    function purchaseTokens(uint256 propertyId, uint256 amount) external;

    /// @notice Pause a property (owner or admin only)
    function pauseProperty(uint256 propertyId) external;

    /// @notice Unpause a property (owner or admin only)
    function unpauseProperty(uint256 propertyId) external;

    /// @notice Get property details
    function getProperty(uint256 propertyId) external view returns (Property memory);

    /// @notice Get total number of listed properties
    function totalProperties() external view returns (uint256);
}
