// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StakedNest is ERC20 {
    constructor() ERC20("Staked Nest", "stNEST") {
        uint256 initialSupply = 1e9 * (10 ** decimals());
        _mint(msg.sender, initialSupply);
    }
}