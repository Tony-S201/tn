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

    it("Should calculate rewards correctly for various durations", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
  
      // Approve and stake tokens
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).stake(amount);
  
      const initialTimestamp = await time.latest();
      
      // Test different durations
      const durations = [1, 2, 3, 7, 30]; // days
      
      for(const days of durations) {
          // Move time forward
          await time.increaseTo(initialTimestamp + (86400 * days));
          
          // Calculate expected rewards
          const expectedRewards = (amount * BigInt(REWARD_RATE) * BigInt(days)) / BigInt(REWARD_RATE_DENOMINATOR);
          
          // Get actual rewards
          const rewards = await staking.calcRewards(owner.address);
          
          // Compare
          expect(rewards).to.be.closeTo(
              expectedRewards,
              ethers.parseEther("0.001"),
              `Rewards incorrect for ${days} days`
          );
      }
    });

    it("Should calculate correct rewards for multiple users", async function () {
      const { owner, otherAccount, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
  
      // Send some tokens to the second account
      await nest.connect(owner).transfer(otherAccount.address, amount);
  
      // Approvals
      await nest.connect(owner).approve(staking.target, amount);
      await nest.connect(otherAccount).approve(staking.target, amount);
  
      // Stake (correction de staking à stake)
      await staking.connect(owner).stake(amount);
      await staking.connect(otherAccount).stake(amount);
  
      // Get initial timestamp
      const initialTimestamp = await time.latest();
  
      // Move time forward by 10 days
      const numberOfDays = 10;
      await time.increaseTo(initialTimestamp + (86400 * numberOfDays));
  
      // Calculate expected rewards for 10 days
      const expectedRewards = (amount * BigInt(REWARD_RATE) * BigInt(numberOfDays)) / BigInt(REWARD_RATE_DENOMINATOR);
  
      // Get actual rewards
      const ownerRewards = await staking.calcRewards(owner.address);
      const otherAccountRewards = await staking.calcRewards(otherAccount.address);
  
      // Verify both users have the same rewards
      expect(ownerRewards).to.equal(otherAccountRewards);
  
      // Verify the rewards amount is correct
      expect(ownerRewards).to.be.closeTo(
          expectedRewards,
          ethers.parseEther("0.001")
      );
      expect(otherAccountRewards).to.be.closeTo(
          expectedRewards,
          ethers.parseEther("0.001")
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
  
      // Add rewards to staking contract
      await nest.transfer(otherAccount.address, rewardAmount);
      await nest.connect(otherAccount).approve(staking.target, rewardAmount);
      await staking.connect(otherAccount).addRewards(rewardAmount);
  
      // Stake initial
      await nest.connect(owner).approve(staking.target, stakeAmount);
      await staking.connect(owner).stake(stakeAmount);
  
      await time.increase(24 * 60 * 60); // 1 jour
  
      const initialNestBalance = await nest.balanceOf(owner.address);
      const rawRewards = await staking.calcRewards(owner.address);
      // Calculate rewards after 2% burn
      const burnRate = await staking.BURN_RATE();
      const expectedRewards = rawRewards * (1000n - burnRate) / 1000n;
  
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
  
      // Add rewards to staking contract
      await nest.transfer(otherAccount.address, rewardAmount);
      await nest.connect(otherAccount).approve(staking.target, rewardAmount);
      await staking.connect(otherAccount).addRewards(rewardAmount);
  
      await nest.connect(owner).approve(staking.target, stakeAmount);
      await staking.connect(owner).stake(stakeAmount);
  
      await time.increase(24 * 60 * 60);
      const rawRewards = await staking.calcRewards(owner.address);
      // Calculate rewards after 2% burn
      const burnRate = await staking.BURN_RATE();
      const expectedRewards = rawRewards * (1000n - burnRate) / 1000n;
  
      await expect(staking.connect(owner).unstake(stakeAmount))
          .to.emit(staking, "Unstaked")
          .withArgs(owner.address, stakeAmount, expectedRewards);
    });
  });

  describe("Withdrawal", function () {
    it("Should revert if user has no stake", async function () {
      const { owner, staking } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      expect(staking.connect(owner).unstake(amount))
        .to.be.revertedWith("Staked amount must be higher than 0");
    });

    it("Should revert if withdrawal amount exceeds staked amount", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
      const amountW = ethers.parseEther("200");

      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).stake(amount); 

      expect(staking.connect(owner).unstake(amountW))
        .to.be.revertedWith("Withdrawal amount exceeds staked amount");
    });

    it("Should transfer correct staking tokens back to user", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      const currentAmount = await nest.connect(owner).balanceOf(owner.address);

      // Approve and stake
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).stake(amount); 

      // Withdraw
      await staking.connect(owner).unstake(amount);

      // Compare previous and new balance
      expect(await nest.connect(owner).balanceOf(owner.address))
        .to.be.equal(currentAmount);
    });

    it("Should transfer correct reward tokens to user", async function () {
      const { owner, otherAccount, staking, nest, stNest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
      const rewardAmount = ethers.parseEther("1000");
  
      // Initial nest user balance
      const initialNestBalance = await nest.balanceOf(owner.address);
  
      // Add rewards to staking contract
      await nest.transfer(otherAccount.address, rewardAmount);
      await nest.connect(otherAccount).approve(staking.target, rewardAmount);
      await staking.connect(otherAccount).addRewards(rewardAmount);
  
      // Approve and stake 100 NEST
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).stake(amount);
  
      const balanceAfterStake = await nest.balanceOf(owner.address);
  
      // Get initial timestamp
      const initialTimestamp = await time.latest();
  
      // Move time forward by 10 days
      const numberOfDays = 10;
      await time.increaseTo(initialTimestamp + (86400 * numberOfDays));
  
      // Get rewards directly from contract for verification
      const rawRewards = await staking.calcRewards(owner.address);
      // Calculate rewards after 2% burn
      const burnRate = await staking.BURN_RATE();
      const expectedRewards = rawRewards * (1000n - burnRate) / 1000n;
  
      // Withdraw
      await staking.connect(owner).unstake(amount);
  
      const finalBalance = await nest.balanceOf(owner.address);
  
      // After unstaking, we should have: initial balance + staked amount + rewards after burn
      expect(finalBalance).to.be.equal(balanceAfterStake + amount + expectedRewards);
      expect(await stNest.balanceOf(owner.address)).to.equal(0);
      expect(await staking.totalStaked()).to.equal(0);
    });

    it("Should update stake amount correctly after partial withdrawal", async function () {
      const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseEther("100");
      const withdrawAmount = ethers.parseEther("40");
      const rewardAmount = ethers.parseEther("1000");
  
      // Add rewards to contract
      await nest.connect(owner).approve(staking.target, rewardAmount);
      await staking.connect(owner).addRewards(rewardAmount);
  
      // Approve and stake
      await nest.connect(owner).approve(staking.target, stakeAmount);
      await staking.connect(owner).stake(stakeAmount);
  
      // Verify initial stake amount
      expect(await stNest.balanceOf(owner.address)).to.equal(stakeAmount);
      expect(await staking.totalStaked()).to.equal(stakeAmount);
  
      // Partial unstake
      await staking.connect(owner).unstake(withdrawAmount);
  
      // Check remaining stake
      const remainingStake = await stNest.balanceOf(owner.address);
      expect(remainingStake).to.equal(stakeAmount - withdrawAmount);
      expect(await staking.totalStaked()).to.equal(stakeAmount - withdrawAmount);
    });

    it("Should emit Unstake event with correct parameters", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
      const rewardAmount = ethers.parseEther("1000");
  
      // Add rewards to contract
      await nest.connect(owner).approve(staking.target, rewardAmount);
      await staking.connect(owner).addRewards(rewardAmount);
  
      // Stake tokens
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).stake(amount);
  
      // Advance time
      await time.increase(24 * 60 * 60); // 1 day
  
      // Calculate expected rewards with burn
      const rawRewards = await staking.calcRewards(owner.address);
      const burnRate = await staking.BURN_RATE();
      const expectedRewards = rawRewards * (1000n - burnRate) / 1000n;
  
      // Verify emit event on unstake
      await expect(staking.connect(owner).unstake(amount))
          .to.emit(staking, "Unstaked")
          .withArgs(owner.address, amount, expectedRewards);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle multiple stakes from same user", async function () {
        const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
        const amount1 = ethers.parseEther("50");
        const amount2 = ethers.parseEther("30");
        const rewardAmount = ethers.parseEther("1000");

        // Add rewards
        await nest.connect(owner).approve(staking.target, rewardAmount);
        await staking.connect(owner).addRewards(rewardAmount);

        // Approve and stake twice
        await nest.connect(owner).approve(staking.target, amount1 + amount2);
        await staking.connect(owner).stake(amount1);
        await staking.connect(owner).stake(amount2);

        expect(await stNest.balanceOf(owner.address)).to.equal(amount1 + amount2);
        expect(await staking.totalStaked()).to.equal(amount1 + amount2);
    });

    it("Should handle multiple users staking and withdrawing", async function () {
        const { owner, otherAccount, staking, nest, stNest } = await loadFixture(deployStakingFixture);
        const amount = ethers.parseEther("100");
        const rewardAmount = ethers.parseEther("1000");

        // Add rewards
        await nest.connect(owner).approve(staking.target, rewardAmount);
        await staking.connect(owner).addRewards(rewardAmount);

        // Transfer tokens to other account
        await nest.connect(owner).transfer(otherAccount.address, amount);

        // Approve and stake
        await nest.connect(owner).approve(staking.target, amount);
        await nest.connect(otherAccount).approve(staking.target, amount);

        await staking.connect(owner).stake(amount);
        await staking.connect(otherAccount).stake(amount);

        await time.increase(24 * 60 * 60 * 3); // 3 days

        // Record rewards before unstaking
        const ownerRewards = await staking.calcRewards(owner.address);
        const otherRewards = await staking.calcRewards(otherAccount.address);

        // Unstake
        await staking.connect(owner).unstake(amount);
        await staking.connect(otherAccount).unstake(amount);

        expect(await stNest.balanceOf(owner.address)).to.equal(0);
        expect(await stNest.balanceOf(otherAccount.address)).to.equal(0);
        expect(await staking.totalStaked()).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small stake amounts", async function () {
        const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
        const smallAmount = ethers.parseEther("0.000000000000000001");
        const rewardAmount = ethers.parseEther("1000");

        // Add rewards
        await nest.connect(owner).approve(staking.target, rewardAmount);
        await staking.connect(owner).addRewards(rewardAmount);

        await nest.connect(owner).approve(staking.target, smallAmount);
        await staking.connect(owner).stake(smallAmount);

        expect(await stNest.balanceOf(owner.address)).to.equal(smallAmount);
        expect(await staking.totalStaked()).to.equal(smallAmount);
    });
  });

  describe("Security Tests", function () {
    it("Should maintain correct balances after failed transactions", async function () {
        const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
        const amount = ethers.parseEther("100");

        const initialBalance = await nest.balanceOf(owner.address);

        // Try to stake without approval
        await expect(staking.connect(owner).stake(amount))
            .to.be.revertedWith("Need approval");

        expect(await nest.balanceOf(owner.address)).to.equal(initialBalance);
        expect(await stNest.balanceOf(owner.address)).to.equal(0);
    });

    it("Should not allow unstaking more than staked", async function () {
        const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
        const stakeAmount = ethers.parseEther("100");
        const withdrawAmount = ethers.parseEther("150");
        const rewardAmount = ethers.parseEther("1000");

        // Add rewards
        await nest.connect(owner).approve(staking.target, rewardAmount);
        await staking.connect(owner).addRewards(rewardAmount);

        await nest.connect(owner).approve(staking.target, stakeAmount);
        await staking.connect(owner).stake(stakeAmount);

        await expect(staking.connect(owner).unstake(withdrawAmount))
            .to.be.revertedWith("Invalid amount");
    });

    it("Should handle token approval changes correctly", async function () {
        const { owner, staking, nest, stNest } = await loadFixture(deployStakingFixture);
        const amount = ethers.parseEther("100");

        // Approve and disapprove
        await nest.connect(owner).approve(staking.target, amount);
        await nest.connect(owner).approve(staking.target, 0);

        // Try to stake
        await expect(staking.connect(owner).stake(amount))
            .to.be.revertedWith("Need approval");

        expect(await stNest.balanceOf(owner.address)).to.equal(0);
        expect(await staking.totalStaked()).to.equal(0);
    });
  });

});
