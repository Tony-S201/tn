// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NestFaucet {
  IERC20 public nestToken;
  uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1000 NEST
  mapping(address => uint256) public lastFaucetTime;
  uint256 public constant COOLDOWN = 24 hours;

  constructor(address _nestToken) {
    nestToken = IERC20(_nestToken);
  }

  function requestTokens() external {
    require(block.timestamp >= lastFaucetTime[msg.sender] + COOLDOWN, "Try again later");
    require(nestToken.balanceOf(address(this)) >= FAUCET_AMOUNT, "Faucet Empty");

    lastFaucetTime[msg.sender] = block.timestamp;
    nestToken.transfer(msg.sender, FAUCET_AMOUNT);
  }
}