const {
  loadFixture,
  time
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

// Constants
const REWARD_RATE = 100;

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

    // Transfer only a portion of stNEST to the staking contract for rewards
    const totalSupply = await stNest.totalSupply();
    const stakingFunds = totalSupply / 5n; // 20% for rewards
    await stNest.transfer(staking.target, stakingFunds);

    return { owner, otherAccount, nest, stNest, staking };
  }

  describe("Deployment", function () {
    it("Should set the correct staking and reward tokens", async function () {
      const { nest, stNest, staking } = await loadFixture(deployStakingFixture);

      expect(await staking.stakingToken()).to.equal(nest.target);
      expect(await staking.rewardToken()).to.equal(stNest.target);
    });
    it("Should mint the supply at deployment", async function () {
      const { nest, stNest } = await loadFixture(deployStakingFixture);

      const nestExpectedSupply = await ethers.parseEther('1000000000');
      const stakedNestExpectedSupply = await ethers.parseEther('1000000000');

      expect(await nest.totalSupply()).to.be.equal(nestExpectedSupply);
      expect(await stNest.totalSupply()).to.be.equal(stakedNestExpectedSupply);
    });
    it("Owner should have the tokens at deployment", async function() {
      const { owner, nest, stNest } = await loadFixture(deployStakingFixture);

      const nestExpectedSupply = await ethers.parseEther('1000000000');
      const stakedNestExpectedSupply = await ethers.parseEther('800000000');

      expect(await nest.balanceOf(owner.address)).to.be.equal(nestExpectedSupply);
      expect(await stNest.balanceOf(owner.address)).to.be.equal(stakedNestExpectedSupply);
    })
  });

  describe("Staking", function () {

    it("Should revert if staking amount is 0", async function () {
      const { owner, staking } = await loadFixture(deployStakingFixture);

      await expect(staking.connect(owner).staking(0))
        .to.be.revertedWith("Amount must be higher than 0");
    });

    it("Should revert if user has insufficient balance", async function () {
      const { otherAccount, staking } = await loadFixture(deployStakingFixture);

      await expect(staking.connect(otherAccount).staking(100))
        .to.be.revertedWith("Not enough token");
    });

    it("Should revert if not approved", async function () {
      const { owner, nest, staking } = await loadFixture(deployStakingFixture);

      await nest.connect(owner).approve(staking.target, 0);
      await expect(staking.connect(owner).staking(100))
        .to.be.revertedWith("Need to approve tokens first");
    });

    it("Should stake tokens correctly", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Approve tokens
      await nest.connect(owner).approve(staking.target, amount);

      // Stake amount
      await staking.connect(owner).staking(amount);

      // Get current staking amount
      const stake = await staking.stakes(owner.address);

      // Compare
      expect(stake.amount).to.equal(amount);

      // Compare timestamp
      expect(stake.timestamp).to.be.closeTo(
        (await ethers.provider.getBlock("latest")).timestamp,
        2
      );
    });

    it("Should emit Staked event", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");
      await nest.connect(owner).approve(staking.target, amount);
      await expect(staking.connect(owner).staking(amount))
        .to.emit(staking, "Staked")
        .withArgs(owner, amount);
    });

  });

  describe("Rewards Calculation", function () {

    it("Should return 0 for user with no stake", async function () {
      const { otherAccount, staking } = await loadFixture(deployStakingFixture);

      expect(await staking.connect(otherAccount).calcRewards(otherAccount.address))
        .to.be.equal(0);
    });

    it("Should calculate rewards correctly after one day", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Approve and stake tokens
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).staking(amount);

      // Move time forward by 1 day
      await time.increase(24 * 60 * 60);

      // Convert all numbers to BigInt before multiplication
      const expectedRewards = amount * BigInt(REWARD_RATE) * BigInt(86400); // 86400 represents seconds in a day

      // Get calculated rewards
      const rewards = await staking.calcRewards(owner.address);

      // Compare with small margin of error for time variations
      expect(rewards).to.be.closeTo(
        expectedRewards,
        ethers.parseEther("0.1") // Allow 0.1 token difference for rounding
      );
    });

    it("Should calculate rewards correctly after multiple days", async function () {
      const { owner, staking, nest } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("100");

      // Approve and stake tokens
      await nest.connect(owner).approve(staking.target, amount);
      await staking.connect(owner).staking(amount);

      // Move time forward by 10 days
      await time.increase(24 * 60 * 60 * 10);

      // Convert all numbers to BigInt before multiplication
      const expectedRewards = amount * BigInt(REWARD_RATE) * BigInt(864000); // 864000 represents seconds in 10 days

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

    it("Should update stake amount correctly after partial withdrawal", async function () {});
    it("Should emit Withdraw event with correct parameters", async function () {});
  });

  describe("Integration Tests", function () {
    it("Should handle stake, wait, withdraw cycle correctly", async function () {});
    it("Should handle multiple stakes from same user", async function () {});
    it("Should handle multiple users staking and withdrawing", async function () {});
  });

  describe("Edge Cases", function () {
    it("Should handle stake and immediate withdrawal", async function () {});
    it("Should handle maximum possible stake amount", async function () {});
    it("Should handle very small stake amounts", async function () {});
  });

  describe("Security Tests", function () {
    it("Should maintain correct balances after failed transactions", async function () {});
    it("Should not allow withdrawing more than staked", async function () {});
    it("Should handle token approval changes correctly", async function () {});
  });

});
