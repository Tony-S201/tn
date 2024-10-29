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

    event Staked(address staker, uint amount);
    event Withdraw(address staker, uint _amount, uint _rewards);

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken); // Define staking token.
        rewardToken = IERC20(_rewardToken); // Define reward token.
    }

    function staking(uint _amount) external {
        // Check conditions
        require(_amount > 0, "Amount must be higher than 0");
        require(stakingToken.balanceOf(msg.sender) > 0, "Not enough token");

        // Check approval
        uint256 allowance = stakingToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Need to approve tokens first");

        // Transfer tokens to the contract
        stakingToken.transferFrom(msg.sender, address(this), _amount);

        // Update stake informations
        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].timestamp = block.timestamp;

        // Emit event
        emit Staked(msg.sender, _amount);
    }

    function calcRewards(address _user) public view returns(uint256) {
        StakeInfo memory userStakeInfo = stakes[_user];
        if (userStakeInfo.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - userStakeInfo.timestamp;
        return (userStakeInfo.amount * REWARD_RATE * timeElapsed);
    }

    function withdraw(uint256 _amount) external {
        uint256 stakedAmount = stakes[msg.sender].amount;
        require(stakedAmount > 0, "Staked amount must be higher than 0"); // Check staked amount

        uint256 rewards = calcRewards(msg.sender); // Get reward amount

        stakes[msg.sender].amount -= _amount; // Update current stake amount

        // Transfer tokens and rewards
        stakingToken.transfer(msg.sender, stakedAmount);
        rewardToken.transfer(msg.sender, rewards);

        emit Withdraw(msg.sender, _amount, rewards);
    }
}