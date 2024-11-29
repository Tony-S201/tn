// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakedNest is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Staked Nest", "stNEST") {
        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); // Admin
        _grantRole(MINTER_ROLE, msg.sender); // Minter

        // Initial Supply
        uint256 initialSupply = 1e9 * (10 ** decimals());
        _mint(msg.sender, initialSupply);
    }

     function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}