// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./StakedNest.sol";

contract Staking {
    ERC20Burnable public immutable nestToken; // Token for staking and reward
    StakedNest public immutable stNest; // Receipt token when stake

    uint256 public constant REWARD_RATE = 1000; // 10% daily = 1000/10000
    uint256 public constant REWARD_RATE_DENOMINATOR = 10000;
    uint256 public constant SECONDS_IN_DAY = 86400;
    uint256 public constant BURN_RATE = 20; // 2% burn rate on rewards only

    uint256 public totalStaked;
    uint256 public totalBurned;
    mapping(address => uint256) public stakeTimestamp;

    event RewardsAdded(address indexed provider, uint256 amount);
    event Staked(address indexed user, uint amount);
    event Unstaked(address indexed user, uint amount, uint rewards);
    event TokensBurned(uint256 amount);

    constructor(address _token, address _sToken) {
        nestToken = ERC20Burnable(_token); // Define staking token.
        stNest = StakedNest(_sToken); // Define reward token.
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        require(nestToken.allowance(msg.sender, address(this)) >= _amount, "Need approval");

        // Transfer NEST tokens to contract
        require(nestToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        // Mint stNEST tokens 1:1
        stNest.mint(msg.sender, _amount);

        // Update state
        stakeTimestamp[msg.sender] = block.timestamp;
        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    function addRewards(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 balanceBefore = nestToken.balanceOf(address(this));
        require(nestToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        uint256 balanceAfter = nestToken.balanceOf(address(this));
        require(balanceAfter - balanceBefore == _amount, "Transfer amount mismatch");
        
        emit RewardsAdded(msg.sender, _amount);
    }

    function calcRewards(address _user) public view returns (uint256) {
        uint256 stakedAmount = stNest.balanceOf(_user);
        if (stakedAmount == 0) return 0;

        uint256 currentTime = block.timestamp;
        uint256 stakingTime = stakeTimestamp[_user];
        if (currentTime <= stakingTime) return 0;

        uint256 timeElapsed = currentTime - stakingTime;
        uint256 exactDays = (timeElapsed * REWARD_RATE_DENOMINATOR) / SECONDS_IN_DAY;
        uint256 rewards = (stakedAmount * REWARD_RATE * exactDays) / (REWARD_RATE_DENOMINATOR * REWARD_RATE_DENOMINATOR);

        return rewards;
    }

    function calcEstimatedRewardsForDays(uint256 _amount, uint256 _days) public pure returns(uint256) {
        if (_amount == 0 || _days == 0) return 0;

        return (_amount * REWARD_RATE * _days) / REWARD_RATE_DENOMINATOR;
    }

    function unstake(uint256 _amount) external {
        // Check if user has enough staked tokens
        uint256 stakedAmount = stNest.balanceOf(msg.sender);
        require(_amount > 0 && _amount <= stakedAmount, "Invalid amount");

        // Calculate rewards for the staking period
        uint256 rewards = calcRewards(msg.sender);
        
        // Calculate burn on rewards only (2% burn rate)
        uint256 burnAmountRewards = (rewards * BURN_RATE) / 1000;
        uint256 actualRewards = rewards - burnAmountRewards;

        // Total amount to send: original staked amount + rewards after burn
        uint256 totalToSend = _amount + actualRewards;
        
        // Verify contract has enough NEST tokens
        require(nestToken.balanceOf(address(this)) >= totalToSend, "Insufficient balance");

        // Burn stNEST (receipt tokens) to release stake
        stNest.burn(msg.sender, _amount);

        // Execute burn on rewards if any
        if (burnAmountRewards > 0) {
            nestToken.burn(burnAmountRewards);
            totalBurned += burnAmountRewards;
            emit TokensBurned(burnAmountRewards);
        }

        // Transfer original stake + rewards after burn
        nestToken.transfer(msg.sender, totalToSend);
        
        // Update total staked amount
        totalStaked -= _amount;
        // Reset staking timestamp for remaining tokens
        stakeTimestamp[msg.sender] = block.timestamp;

        // Emit unstake event with original amount and actual rewards
        emit Unstaked(msg.sender, _amount, actualRewards);
    }

    function getStakedBalance(address _user) external view returns (uint256) {
        return stNest.balanceOf(_user);
    }

    function getContractNestBalance() external view returns (uint256) {
        return nestToken.balanceOf(address(this));
    }

    function getTotalBurned() public view returns (uint256) {
        return totalBurned;
    }

}