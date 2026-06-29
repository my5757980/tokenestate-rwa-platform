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

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Accumulate rent per token (1e18 scaling)
        totalRentPerToken[propertyId] += (amount * 1e18) / supply;

        emit RentDeposited(propertyId, msg.sender, amount);
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

    /// @notice Called by PropertyRegistry._update on every token transfer
    function snapshotDebt(address from, address to, uint256 propertyId) external {
        require(msg.sender == address(registry), "RentDistributor: only registry");

        // Settle pending rent for 'from' before their balance decreases
        if (from != address(0) && from != address(registry)) {
            uint256 pendingFrom = pendingRent(from, propertyId);
            if (pendingFrom > 0) {
                debtPerToken[propertyId][from] = totalRentPerToken[propertyId];
                usdc.safeTransfer(from, pendingFrom);
                emit RentClaimed(propertyId, from, pendingFrom);
            } else {
                debtPerToken[propertyId][from] = totalRentPerToken[propertyId];
            }
        }

        // Initialize debt for 'to' at current accumulator (prevents claiming historical rent)
        if (to != address(0) && to != address(registry)) {
            if (debtPerToken[propertyId][to] == 0) {
                debtPerToken[propertyId][to] = totalRentPerToken[propertyId];
            }
        }
    }

    function pendingRent(address holder, uint256 propertyId) public view returns (uint256) {
        uint256 balance = registry.balanceOf(holder, propertyId);
        if (balance == 0) return 0;
        uint256 perToken = totalRentPerToken[propertyId] - debtPerToken[propertyId][holder];
        return (balance * perToken) / 1e18;
    }
}
