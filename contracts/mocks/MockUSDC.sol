// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDC — Testnet-only USDC with public mint for testing
/// @dev 6 decimals to match real USDC. Never deploy to mainnet.
contract MockUSDC is ERC20, Ownable {
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint test USDC to any address (testnet only)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
