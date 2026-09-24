// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./interfaces/IPropertyRegistry.sol";
import "./interfaces/IRentDistributor.sol";
import "./interfaces/IKYCBadge.sol";

/// @title PropertyRegistry — ERC-1155 fractional real estate tokenization
/// @notice Each property gets a unique ERC-1155 tokenId. Fractional shares are fungible.
contract PropertyRegistry is IPropertyRegistry, ERC1155, ERC1155Pausable, ERC1155Holder, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── State ───────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    IKYCBadge public immutable kycBadge;
    IRentDistributor public rentDistributor;

    uint256 private _propertyCounter;
    mapping(uint256 => Property) private _properties;

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _usdc, address _kycBadge) ERC1155("") Ownable(msg.sender) {
        require(_kycBadge != address(0), "PropertyRegistry: KYC badge required");
        usdc = IERC20(_usdc);
        kycBadge = IKYCBadge(_kycBadge);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function setRentDistributor(address _rentDistributor) external onlyOwner {
        rentDistributor = IRentDistributor(_rentDistributor);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── US1: Property Tokenization ──────────────────────────────────────────

    function listProperty(
        string calldata metadataCID,
        uint256 totalSupply,
        uint256 pricePerToken
    ) external returns (uint256 propertyId) {
        if (totalSupply == 0) revert InvalidTokenAmount();
        if (pricePerToken == 0) revert InvalidPrice();
        if (bytes(metadataCID).length == 0) revert EmptyMetadataCID();

        _propertyCounter++;
        propertyId = _propertyCounter;

        _properties[propertyId] = Property({
            id: propertyId,
            owner: msg.sender,
            metadataCID: metadataCID,
            totalSupply: totalSupply,
            pricePerToken: pricePerToken,
            tokensSold: 0,
            active: true
        });

        // Mint all tokens to this contract — buyers pull from here
        _mint(address(this), propertyId, totalSupply, "");

        emit PropertyListed(propertyId, msg.sender, metadataCID, totalSupply, pricePerToken);
    }

    function pauseProperty(uint256 propertyId) external {
        if (_properties[propertyId].owner != msg.sender) revert NotPropertyOwner(propertyId, msg.sender);
        _properties[propertyId].active = false;
        emit PropertyPaused(propertyId);
    }

    function unpauseProperty(uint256 propertyId) external {
        if (_properties[propertyId].owner != msg.sender) revert NotPropertyOwner(propertyId, msg.sender);
        _properties[propertyId].active = true;
        emit PropertyUnpaused(propertyId);
    }

    // ─── US2: Fractional Investment ──────────────────────────────────────────

    function purchaseTokens(uint256 propertyId, uint256 amount) external nonReentrant {
        Property storage prop = _properties[propertyId];
        if (!prop.active) revert PropertyNotActive(propertyId);
        if (amount == 0) revert InvalidTokenAmount();

        uint256 available = prop.totalSupply - prop.tokensSold;
        if (amount > available) revert InsufficientTokensAvailable(available, amount);

        uint256 totalCost = amount * prop.pricePerToken;
        prop.tokensSold += amount;

        // Collect USDC from buyer, send directly to property owner
        usdc.safeTransferFrom(msg.sender, prop.owner, totalCost);

        // Transfer fractional tokens from registry to buyer
        _safeTransferFrom(address(this), msg.sender, propertyId, amount, "");

        emit TokensPurchased(propertyId, msg.sender, amount, totalCost);
    }

    // ─── ERC-1155 Override — sync rent accumulator on every transfer ──────────

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Pausable) {
        // Only a wallet with an active KYC badge may receive tokens: this covers the primary sale,
        // the Marketplace and plain transfers alike. The registry itself holds the unsold supply.
        if (to != address(0) && to != address(this) && !kycBadge.isVerified(to)) revert NotKYCVerified(to);

        // Settle rent BEFORE balances move, so each side is paid on the balance that earned it
        if (address(rentDistributor) != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                rentDistributor.snapshotDebt(from, to, ids[i]);
            }
        }

        super._update(from, to, ids, values);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    function getProperty(uint256 propertyId) external view returns (Property memory) {
        return _properties[propertyId];
    }

    function totalProperties() external view returns (uint256) {
        return _propertyCounter;
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, ERC1155Holder, IERC165) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
