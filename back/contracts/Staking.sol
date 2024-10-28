// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => StakeInfo) public stakes; // StakeInfo for each address
    uint256 constant REWARD_RATE = 100; // Reward rate

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken); // Define staking token.
        rewardToken = IERC20(_rewardToken); // Define reward token.
    }
}