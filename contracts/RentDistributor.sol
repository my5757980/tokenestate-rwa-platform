// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRentDistributor.sol";
import "./interfaces/IPropertyRegistry.sol";

/// @title RentDistributor — Pull-pattern rent distribution (accumulator per token)
/// @notice O(1) per claim regardless of holder count. Uses Synthetix-style reward accumulator.
contract RentDistributor is IRentDistributor, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── State ───────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    IPropertyRegistry public immutable registry;

    /// @dev Global rent-per-token accumulator (scaled by 1e18 to avoid precision loss)
    mapping(uint256 => uint256) public totalRentPerToken;

    /// @dev Per-user debt snapshot — updated on every balance change
    mapping(uint256 => mapping(address => uint256)) public debtPerToken;

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _usdc, address _registry) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        registry = IPropertyRegistry(_registry);
    }

    // ─── US3: Rent Distribution ───────────────────────────────────────────────

    function depositRent(uint256 propertyId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroRentAmount();

        IPropertyRegistry.Property memory prop = registry.getProperty(propertyId);
        if (prop.owner != msg.sender) revert NotPropertyOwner(propertyId, msg.sender);

        uint256 supply = prop.totalSupply;
        if (supply == 0) revert ZeroTokenSupply(propertyId);

        // Rent per token (1e18 scaling), earned by every token of the property
        uint256 perToken = (amount * 1e18) / supply;

        // Unsold tokens sit in the registry and belong to the owner, so only the share of the tokens
        // investors hold is collected; the rest would otherwise be stuck here, claimable by no one.
        // Rounded up, so the holders' claims (rounded down) can never exceed what was collected.
        uint256 held = supply - registry.balanceOf(address(registry), propertyId);
        if (held == 0) revert NoTokenHolders(propertyId);
        uint256 collected = (held * perToken + 1e18 - 1) / 1e18;
        if (collected == 0) revert ZeroRentAmount();

        usdc.safeTransferFrom(msg.sender, address(this), collected);

        totalRentPerToken[propertyId] += perToken;

        emit RentDeposited(propertyId, msg.sender, collected);
    }

    function claimRent(uint256 propertyId) external nonReentrant {
        uint256 pending = pendingRent(msg.sender, propertyId);
        if (pending == 0) revert NothingToClaim(msg.sender, propertyId);

        // Update debt before transfer (CEI pattern)
        debtPerToken[propertyId][msg.sender] = totalRentPerToken[propertyId];

        usdc.safeTransfer(msg.sender, pending);
        emit RentClaimed(propertyId, msg.sender, pending);
    }

    function claimRentBatch(uint256[] calldata propertyIds) external nonReentrant {
        for (uint256 i = 0; i < propertyIds.length; i++) {
            uint256 pending = pendingRent(msg.sender, propertyIds[i]);
            if (pending > 0) {
                debtPerToken[propertyIds[i]][msg.sender] = totalRentPerToken[propertyIds[i]];
                usdc.safeTransfer(msg.sender, pending);
                emit RentClaimed(propertyIds[i], msg.sender, pending);
            }
        }
    }

    /// @notice Called by PropertyRegistry._update on every token transfer, BEFORE balances change:
    /// pays each side the rent its current balance has earned, then restarts both at the current
    /// accumulator, so tokens that move carry no rent their new holder did not earn.
    function snapshotDebt(address from, address to, uint256 propertyId) external {
        require(msg.sender == address(registry), "RentDistributor: only registry");

        if (from != address(0) && from != address(registry)) _settle(from, propertyId);
        if (to != address(0) && to != address(registry)) _settle(to, propertyId);
    }

    /// @dev Pay out what `holder` has earned so far and restart its checkpoint at the current accumulator.
    function _settle(address holder, uint256 propertyId) private {
        uint256 pending = pendingRent(holder, propertyId);
        debtPerToken[propertyId][holder] = totalRentPerToken[propertyId];
        if (pending > 0) {
            usdc.safeTransfer(holder, pending);
            emit RentClaimed(propertyId, holder, pending);
        }
    }

    function pendingRent(address holder, uint256 propertyId) public view returns (uint256) {
        uint256 balance = registry.balanceOf(holder, propertyId);
        if (balance == 0) return 0;
        uint256 perToken = totalRentPerToken[propertyId] - debtPerToken[propertyId][holder];
        return (balance * perToken) / 1e18;
    }
}
