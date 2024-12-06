const {
  loadFixture,
  time
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion NEST
const INITIAL_LIQUIDITY_NEST = ethers.parseEther("100000"); // 100,000 NEST
const INITIAL_LIQUIDITY_ETH = ethers.parseEther("100"); // 100 ETH

describe("Liquidity Pool Contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployLPFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy NEST token
    const Nest = await ethers.getContractFactory("Nest");
    const nest = await Nest.deploy();

    // Deploy Liquidity Pool contract
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const lp = await LiquidityPool.deploy(nest.target);

    // Approve LiquidityPool to spend owner's NEST
    await nest.approve(await lp.target, INITIAL_SUPPLY);

    return { owner, user1, user2, nest, lp };
  }

  async function deployLPWithLiquidityFixture() {
    const { owner, user1, user2, nest, lp } = await loadFixture(deployLPFixture);

    // Add initial liquidity
    await lp.addLiquidity(
      INITIAL_LIQUIDITY_NEST,
      INITIAL_LIQUIDITY_NEST,
      INITIAL_LIQUIDITY_ETH,
      owner.address,
      ethers.MaxUint256,
      { value: INITIAL_LIQUIDITY_ETH }
    );

    return { owner, user1, user2, nest, lp };
  }

  describe("Deployment", function () {

    it("Should set the right token address", async function () {
      const { nest, lp } = await loadFixture(deployLPFixture);
      expect(await lp.token()).to.equal(await nest.target);
    });

    it("Should initialize with zero reserves", async function () {
      const { lp } = await loadFixture(deployLPFixture);
      const [reserve0, reserve1] = await lp.getReserves();
      expect(reserve0).to.equal(0);
      expect(reserve1).to.equal(0);
    });

  });

  describe("Add initial Liquidity", function () {
    it("Should add initial liquidity correctly", async function () {
      const { owner, lp } = await loadFixture(deployLPFixture);
      const tx = await lp.addLiquidity(
        INITIAL_LIQUIDITY_NEST,
        INITIAL_LIQUIDITY_NEST,
        INITIAL_LIQUIDITY_ETH,
        owner.address,
        ethers.MaxUint256,
        { value: INITIAL_LIQUIDITY_ETH }
      );

      await expect(tx).to.emit(lp, "Mint")
        .withArgs(owner.address, INITIAL_LIQUIDITY_ETH, INITIAL_LIQUIDITY_NEST);

      const [reserve0, reserve1] = await lp.getReserves();

      expect(reserve0).to.equal(INITIAL_LIQUIDITY_ETH);
      expect(reserve1).to.equal(INITIAL_LIQUIDITY_NEST);
    });
  });

  describe("Swap", function () {
    it("Should swap ETH for NEST correctly", async function () {
      const { user1, nest, lp } = await loadFixture(deployLPWithLiquidityFixture);

      const swapAmount = ethers.parseEther("1"); // 1 ETH
      const balanceBefore = await nest.balanceOf(user1.address);

      await lp.connect(user1).swapExactETHForTokens(
        0, // Accept any amount of tokens
        user1.address,
        { value: swapAmount }
      );

      const balanceAfter = await nest.balanceOf(user1.address);

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should swap NEST for ETH correctly", async function () {
      const { user1, nest, lp } = await loadFixture(deployLPWithLiquidityFixture);
      const swapAmount = ethers.parseEther("1000"); // 1000 NEST

      // Transfer NEST to user1
      const [owner] = await ethers.getSigners();
      await nest.connect(owner).transfer(user1.address, swapAmount);
      await nest.connect(user1).approve(await lp.getAddress(), swapAmount);

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      await lp.connect(user1).swapExactTokensForETH(
        swapAmount,
        0, // Accept any amount of ETH
        user1.address
      );

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });
  });

  describe("Remove Liquidity", function () {
    it("Should remove liquidity correctly", async function() {
      const { owner, lp, nest } = await loadFixture(deployLPWithLiquidityFixture);

      const ethBalanceBefore = await ethers.provider.getBalance(owner.address);
      const nestBalanceBefore = await nest.balanceOf(owner.address);
      const lpTokenAmount = await lp.balanceOf(owner.address);

      await lp.removeLiquidity(
        lpTokenAmount,
        0, // Accept any amount of ETH
        0, // Accept any amount of NEST
        owner.address
      );

      const ethBalanceAfter = await ethers.provider.getBalance(owner.address);
      const nestBalanceAfter = await nest.balanceOf(owner.address);

      expect(ethBalanceAfter).to.be.greaterThan(ethBalanceBefore);
      expect(nestBalanceAfter).to.be.greaterThan(nestBalanceBefore);
    });
  });

  describe("Quote and Pricing", function () {
    it("Should calculate token amounts correctly", async function () {
      const { lp } = await loadFixture(deployLPWithLiquidityFixture);

      const amountNEST = ethers.parseEther("1000"); // 1000 NEST
      const reserveNEST = ethers.parseEther("100000"); // 100,000 NEST
      const reserveETH = ethers.parseEther("100"); // 100 ETH

      const quoteETH = await lp.quote(amountNEST, reserveNEST, reserveETH);
      expect(quoteETH).to.equal(ethers.parseEther("1"));
    });
    it("Should calculate swap amounts correctly", async function () {
      const { lp } = await loadFixture(deployLPWithLiquidityFixture);

      const amountIn = ethers.parseEther("1"); // 1
      const reserveIn = ethers.parseEther("100"); // 100
      const reserveOut = ethers.parseEther("100000"); // 100,000

      const amountOut = await lp.getAmountOut(amountIn, reserveIn, reserveOut);
      expect(amountOut).to.be.greaterThan(0);
    });
  });

});
