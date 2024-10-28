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

    event Staked(address staker, uint amount); // Event

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken); // Define staking token.
        rewardToken = IERC20(_rewardToken); // Define reward token.
    }

    function staking(uint _amount) external {
        // Check conditions
        require(_amount > 0, "Amount must be higher than 0");
        require(stakingToken.balanceOf(msg.sender) > 0, "Not enough token");

        // Transfer tokens to the contract
        stakingToken.transferFrom(msg.sender, address(this), _amount);

        // Update stake informations
        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].timestamp = block.timestamp;

        // Emit event
        emit Staked(msg.sender, _amount);
    } 
}