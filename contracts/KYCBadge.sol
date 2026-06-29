// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IKYCBadge.sol";

/// @title KYCBadge — Soulbound (non-transferable) KYC identity token
/// @notice One badge per wallet. Transfer blocked via _update override.
contract KYCBadge is IKYCBadge, ERC721, AccessControl {
    bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN_ROLE");

    uint256 private _tokenIdCounter;
    mapping(address => uint256) public holderToBadge;
    mapping(address => bool) private _hasBadge;
    mapping(uint256 => bool) public isRevoked;

    constructor() ERC721("TokenEstate KYC Badge", "TEKYC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_ADMIN_ROLE, msg.sender);
    }

    function issueBadge(address to) external onlyRole(KYC_ADMIN_ROLE) {
        if (_hasBadge[to]) revert AlreadyHasBadge(to);
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        holderToBadge[to] = tokenId;
        _hasBadge[to] = true;
        _safeMint(to, tokenId);
        emit BadgeIssued(to, tokenId);
    }

    function revokeBadge(address holder) external onlyRole(KYC_ADMIN_ROLE) {
        if (!_hasBadge[holder]) revert NoBadgeFound(holder);
        uint256 tokenId = holderToBadge[holder];
        isRevoked[tokenId] = true;
        emit BadgeRevoked(holder, tokenId);
    }

    function isVerified(address wallet) external view returns (bool) {
        if (!_hasBadge[wallet]) return false;
        uint256 tokenId = holderToBadge[wallet];
        return !isRevoked[tokenId];
    }

    function getBadgeId(address wallet) external view returns (uint256) {
        if (!_hasBadge[wallet]) revert NoBadgeFound(wallet);
        return holderToBadge[wallet];
    }

    /// @dev Soulbound: block all transfers. _ownerOf returns address(0) for unminted tokens.
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
