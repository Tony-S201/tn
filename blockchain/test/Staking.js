const {
  loadFixture,
  time
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

// Constants
const REWARD_RATE = 1000;
const REWARD_RATE_DENOMINATOR = 10000;

describe("Staking contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakingFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    // Deploy NEST token
    const Nest = await ethers.getContractFactory("Nest");
    const nest = await Nest.deploy();

    // Deploy stNEST token
    const StakedNest = await ethers.getContractFactory("StakedNest");
    const stNest = await StakedNest.deploy();

    // Deploy staking contract
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(nest.target, stNest.target);

    // Grant MINTER_ROLE to Staking contract
    const MINTER_ROLE = await stNest.MINTER_ROLE();
    await stNest.grantRole(MINTER_ROLE, staking.target);

    return { owner, otherAccount, nest, stNest, staking };
  }

  describe("Deployment", function () {
    it("Should set the correct NEST and stNEST tokens", async function () {
      const { nest, stNest, staking } = await loadFixture(deployStakingFixture);

      expect(await staking.nestToken()).to.equal(nest.target);
      expect(await staking.stNest()).to.equal(stNest.target);
    });

    it("Should mint the NEST supply at deployment", async function () {
      const { nest } = await loadFixture(deployStakingFixture);
      const nestExpectedSupply = ethers.parseEther('1000000000');
      expect(await nest.totalSupply()).to.equal(nestExpectedSupply);
    });
  });

  describe("Staking", function () {
    it("Should revert if staking amount is 0", async function () {
      const { owner, staking } = await loadFixture(deployStakingFixture);
      await expect(staking.connect(owner).stake(0))
        .to.be.revertedWith("Amount must be > 0");
    });

    it("Should revert if not approved", async function () {
      const { owner, staking } = await loadFixture(deployStakingFixture);
      await expect(staking.connect(owner).stake(100))
        .to.be.revertedWith("Need approval");
    });

    it("Should stake tokens correctly", async function () {
      const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Approve tokens
      await nest.connect(owner).approve(staking.target, amount);

      // Initial balances
      const initialNestBalance = await nest.balanceOf(owner.address);
      const initialStNestBalance = await stNest.balanceOf(owner.address);
      const initialTotalStaked = await staking.totalStaked();

      // Stake amount
      await staking.connect(owner).stake(amount);

      // Check NEST transfer
      expect(await nest.balanceOf(owner.address)).to.equal(initialNestBalance - amount);
      expect(await nest.balanceOf(staking.target)).to.equal(amount);

      // Check stNEST minting
      expect(await stNest.balanceOf(owner.address)).to.equal(initialStNestBalance + amount);

      // Check totalStaked update
      expect(await staking.totalStaked()).to.equal(initialTotalStaked + amount);

      // Check timestamp
      expect(await staking.stakeTimestamp(owner.address)).to.be.closeTo(
        (await ethers.provider.getBlock("latest")).timestamp,
        2
      );
    });

    it("Should emit Staked event", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
      await nest.connect(owner).approve(staking.target, amount);
      await expect(staking.connect(owner).stake(amount))
        .to.emit(staking, "Staked")
        .withArgs(owner.address, amount);
    });
  });

  describe("Rewards Calculation", function () {
    it("Should return 0 for user with no stake", async function () {
      const { otherAccount, staking } = await loadFixture(deployStakingFixture);
      expect(await staking.calcRewards(otherAccount.address)).to.equal(0);
    });

    it("Should calculate rewards correctly after one day", async function () {
      const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
  
      // Approve and stake tokens
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).stake(amount);

      // Get initial timestamp
      const initialTimestamp = await time.latest();
  
      // Move time forward by 1 day (86400 seconds)
      await time.increaseTo(initialTimestamp + 86400);
  
      // For 10% reward
      const expectedRewards = (amount * BigInt(REWARD_RATE)) / BigInt(REWARD_RATE_DENOMINATOR);
  
      // Get rewards from contract
      const rewards = await staking.calcRewards(owner.address);
    
      // Compare with small margin of error
      expect(rewards).to.be.closeTo(
          expectedRewards,
          ethers.parseEther("0.001") // Allow small difference
      );
    });
  });

  describe("Unstaking", function () {
    it("Should revert if unstaking amount is 0", async function () {
      const { owner, staking } = await loadFixture(deployStakingFixture);
      await expect(staking.connect(owner).unstake(0))
        .to.be.revertedWith("Invalid amount");
    });

    it("Should unstake tokens correctly with rewards", async function () {
      const { owner, otherAccount, staking, nest, stNest } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseEther("100");
      const rewardAmount = ethers.parseEther("1000");
  
      // Add rewards
      await nest.transfer(otherAccount.address, rewardAmount);
      await nest.connect(otherAccount).approve(staking.target, rewardAmount);
      await staking.connect(otherAccount).addRewards(rewardAmount);
  
      // Stake initial
      await nest.connect(owner).approve(staking.target, stakeAmount);
      await staking.connect(owner).stake(stakeAmount);
  
      await time.increase(24 * 60 * 60); // 1 jour
  
      const initialNestBalance = await nest.balanceOf(owner.address);
      const expectedRewards = await staking.calcRewards(owner.address);
  
      await staking.connect(owner).unstake(stakeAmount);
  
      expect(await nest.balanceOf(owner.address)).to.equal(
          initialNestBalance + stakeAmount + expectedRewards
      );
      expect(await stNest.balanceOf(owner.address)).to.equal(0);
      expect(await staking.totalStaked()).to.equal(0);
    });

    it("Should emit Unstaked event", async function () {
      const { owner, otherAccount, staking, nest } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseEther("100");
      const rewardAmount = ethers.parseEther("1000");

      // Add rewards
      await nest.transfer(otherAccount.address, rewardAmount);
      await nest.connect(otherAccount).approve(staking.target, rewardAmount);
      await staking.connect(otherAccount).addRewards(rewardAmount);

      await nest.connect(owner).approve(staking.target, stakeAmount);
      await staking.connect(owner).stake(stakeAmount);

      await time.increase(24 * 60 * 60);
      const rewards = await staking.calcRewards(owner.address);

      await expect(staking.connect(owner).unstake(stakeAmount))
        .to.emit(staking, "Unstaked")
        .withArgs(owner.address, stakeAmount, rewards);
    });
  });

  /*
    it("Should calculate rewards correctly after multiple days", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Approve and stake tokens
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).staking(amount);

      // Move time forward by 10 days
      await time.increase(24 * 60 * 60 * 10);

      // Calculate expected rewards: (amount * REWARD_RATE * days) / 10000
      const expectedRewards = (amount * BigInt(REWARD_RATE) * BigInt(10)) / BigInt(10000);

      // Get calculated rewards
      const rewards = await staking.calcRewards(owner.address);

      // Compare with small margin of error for time variations
      expect(rewards).to.be.closeTo(
        expectedRewards,
        ethers.parseEther("0.1") // Allow 0.1 token difference for rounding
      );
    });

    it("Should calculate correct rewards for multiple users", async function () {
      const { owner, otherAccount, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Send some tokens to the second account
      await nest.connect(owner).transfer(otherAccount.address, amount);

      // Approvals
      await nest.connect(owner).approve(staking.target, amount);
      await nest.connect(otherAccount).approve(staking.target, amount);

      // Stake
      await staking.connect(owner).staking(amount); 
      await staking.connect(otherAccount).staking(amount);

      // Move time forward by 10 days
      await time.increase(24 * 60 * 60 * 10);   

      const ownerRewards = await staking.calcRewards(owner.address);
      const otherAccountRewards = await staking.calcRewards(otherAccount.address);

      expect(ownerRewards).to.equal(otherAccountRewards);
    });
    
  });

  describe("Withdrawal", function () {
    it("Should revert if user has no stake", async function () {
      const { owner, staking } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      expect(staking.connect(owner).withdraw(amount))
        .to.be.revertedWith("Staked amount must be higher than 0");
    });

    it("Should revert if withdrawal amount exceeds staked amount", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
      const amountW = ethers.parseEther("200");

      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).staking(amount); 

      expect(staking.connect(owner).withdraw(amountW))
        .to.be.revertedWith("Withdrawal amount exceeds staked amount");
    });

    it("Should transfer correct staking tokens back to user", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      const currentAmount = await nest.connect(owner).balanceOf(owner.address);

      // Approve and stake
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).staking(amount); 

      // Withdraw
      await staking.connect(owner).withdraw(amount);

      // Compare previous and new balance
      expect(await nest.connect(owner).balanceOf(owner.address))
        .to.be.equal(currentAmount);
    });

    it("Should transfer correct reward tokens to user", async function () {
      const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Initial stNest user balance
      const initialRewardBalance = await stNest.balanceOf(owner.address);
  
      // Approve and stake 100 NEST
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).staking(amount);
  
      // Move time forward by 10 days
      const days = 10;
      await time.increase(24 * 60 * 60 * days);
  
      // Calc expected rewards
      const expectedRewards = await staking.calcRewards(owner.address);

      // Withdraw
      await staking.connect(owner).withdraw(amount);

      // Check new stNest user balance and compare it to expected value
      const finalRewardBalance = await stNest.balanceOf(owner.address);
      expect(finalRewardBalance - initialRewardBalance)
        .to.be.equal(expectedRewards);
    });

    it("Should update stake amount correctly after partial withdrawal", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseEther("100");
      const withdrawAmount = ethers.parseEther("40");

      // Approve and stake
      await nest.connect(owner).approve(staking.target, stakeAmount);
      await staking.connect(owner).staking(stakeAmount);

      // Partial withdraw
      await staking.connect(owner).withdraw(withdrawAmount);

      // Check final amount
      const remainingStake = await staking.stakes(owner.address);
      expect(remainingStake.amount).to.equal(stakeAmount - withdrawAmount);
    });

    it("Should emit Withdraw event with correct parameters", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).staking(amount);

      await time.increase(24 * 60 * 60); // 1 day
      const expectedRewards = await staking.calcRewards(owner.address);

      await expect(staking.connect(owner).withdraw(amount))
          .to.emit(staking, "Withdraw")
          .withArgs(owner.address, amount, expectedRewards);
    });

  });

  describe("Integration Tests", function () {
    it("Should handle multiple stakes from same user", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount1 = ethers.parseEther("50");
      const amount2 = ethers.parseEther("30");

      await nest.connect(owner).approve(staking.target, amount1 + amount2);

      await staking.connect(owner).staking(amount1);
      await staking.connect(owner).staking(amount2);

      const finalStake = await staking.stakes(owner.address);
      expect(finalStake.amount).to.equal(amount1 + amount2);
    });
    it("Should handle multiple users staking and withdrawing", async function () {
      const { owner, otherAccount, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Transfer tokens to other account
      await nest.connect(owner).transfer(otherAccount.address, amount);

      // Approve and stake
      await nest.connect(owner).approve(staking.target, amount);
      await nest.connect(otherAccount).approve(staking.target, amount);

      await staking.connect(owner).staking(amount);
      await staking.connect(otherAccount).staking(amount);

      await time.increase(24 * 60 * 60 * 3); // 3 days

      // Withdrawal
      await staking.connect(owner).withdraw(amount);
      await staking.connect(otherAccount).withdraw(amount);

      // Check staking amount to 0
      expect((await staking.stakes(owner.address)).amount).to.equal(0);
      expect((await staking.stakes(otherAccount.address)).amount).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum possible user stake amount", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
        const maxAmount = await nest.balanceOf(owner.address);

        await nest.connect(owner).approve(staking.target, maxAmount);
        await staking.connect(owner).staking(maxAmount);

        const stake = await staking.stakes(owner.address);
        expect(stake.amount).to.equal(maxAmount);
    });
    it("Should handle very small stake amounts", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
        const smallAmount = ethers.parseEther("0.000000000000000001");

        await nest.connect(owner).approve(staking.target, smallAmount);
        await staking.connect(owner).staking(smallAmount);

        const stake = await staking.stakes(owner.address);
        expect(stake.amount).to.equal(smallAmount);
    });
  });

  describe("Security Tests", function () {
    it("Should maintain correct balances after failed transactions", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      const initialBalance = await nest.balanceOf(owner.address);

      // Try to stake without token allowance
      await expect(staking.connect(owner).staking(amount))
          .to.be.revertedWith("Need to approve tokens first");

      // Check if balance has changed
      expect(await nest.balanceOf(owner.address)).to.equal(initialBalance);
    });
    it("Should not allow withdrawing more than staked", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseEther("100");
      const withdrawAmount = ethers.parseEther("150");

      await nest.connect(owner).approve(staking.target, stakeAmount);
      await staking.connect(owner).staking(stakeAmount);

      await expect(staking.connect(owner).withdraw(withdrawAmount))
          .to.be.revertedWith("Withdrawal amount exceeds staked amount");
    });
    it("Should handle token approval changes correctly", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Approve and disapprove
      await nest.connect(owner).approve(staking.target, amount);
      await nest.connect(owner).approve(staking.target, 0);

      // Try to stake
      await expect(staking.connect(owner).staking(amount))
          .to.be.revertedWith("Need to approve tokens first");
    });
  });
  */
});
