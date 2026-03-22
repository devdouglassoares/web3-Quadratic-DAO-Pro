// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title QuadraticToken (QTK)
/// @notice ERC20 governance token used as voting currency in the QuadraticDAO
/// @dev Tokens are burned (transferred to DAO treasury) when used for voting
contract QuadraticToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10 ** 18;

    error ExceedsMaxSupply(uint256 requested, uint256 available);

    constructor(address initialOwner)
        ERC20("Quadratic Token", "QTK")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1_000_000 * 10 ** 18);
    }

    /// @notice Mint new tokens (only owner / DAO)
    function mint(address to, uint256 amount) external onlyOwner {
        uint256 remaining = MAX_SUPPLY - totalSupply();
        if (amount > remaining) revert ExceedsMaxSupply(amount, remaining);
        _mint(to, amount);
    }
}
