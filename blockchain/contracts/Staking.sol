// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./StakedNest.sol";

contract Staking {
    IERC20 public immutable nestToken; // Token for staking and reward
    StakedNest public immutable stNest; // Receipt token when stake

    uint256 public constant REWARD_RATE = 1000; // 10% daily = 1000/10000
    uint256 public constant REWARD_RATE_DENOMINATOR = 10000;
    uint256 public constant SECONDS_IN_DAY = 86400;

    uint256 public totalStaked;
    mapping(address => uint256) public stakeTimestamp;

    event RewardsAdded(address indexed provider, uint256 amount);
    event Staked(address indexed user, uint amount);
    event Unstaked(address indexed user, uint amount, uint rewards);

    constructor(address _token, address _sToken) {
        nestToken = IERC20(_token); // Define staking token.
        stNest = StakedNest(_sToken); // Define reward token.
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        require(nestToken.allowance(msg.sender, address(this)) >= _amount, "Need approval");

        // Transfer NEST tokens to contract
        uint256 balanceBefore = nestToken.balanceOf(address(this));
        require(nestToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        uint256 balanceAfter = nestToken.balanceOf(address(this));
        require(balanceAfter - balanceBefore == _amount, "Transfer amount mismatch");

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
        uint256 stakedAmount = stNest.balanceOf(msg.sender);
        require(_amount > 0 && _amount <= stakedAmount, "Invalid amount");

        uint256 rewards = calcRewards(msg.sender);
        uint256 totalToSend = _amount + rewards;

        // Check if contract has a sufficient amount of NEST to reward
        require(nestToken.balanceOf(address(this)) >= totalToSend, "Insufficient balance");

        // Burn stNEST tokens
        stNest.burn(msg.sender, _amount);

        // Transfer NEST tokens (initial stake + rewards)
        nestToken.transfer(msg.sender, totalToSend);
        
        // Update state
        totalStaked -= _amount;
        stakeTimestamp[msg.sender] = block.timestamp;

        emit Unstaked(msg.sender, _amount, rewards);
    }

    function getStakedBalance(address _user) external view returns (uint256) {
        return stNest.balanceOf(_user);
    }

    function getContractNestBalance() external view returns (uint256) {
        return nestToken.balanceOf(address(this));
    }

}