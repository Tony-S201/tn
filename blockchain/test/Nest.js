const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

// Constants
const REWARD_RATE = 100;

describe("Staking contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakingFixture() {
    // Contracts are deployed using the first signer/account by default

    console.log('0')
    const [owner, otherAccount] = await ethers.getSigners();

    console.log("1")
    const Nest = await ethers.getContractFactory("Nest");
    const nest = await Nest.deploy();
    console.log('2')

    const StakedNest = await ethers.getContractFactory("StakedNest");
    const stNest = await StakedNest.deploy();

    console.log('3')

    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(nest.target, stNest.target);

    console.log('4')

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
      const stakedNestExpectedSupply = await ethers.parseEther('1000000000');

      expect(await nest.balanceOf(owner.address)).to.be.equal(nestExpectedSupply);
      expect(await stNest.balanceOf(owner.address)).to.be.equal(stakedNestExpectedSupply);
    })
  });

});
