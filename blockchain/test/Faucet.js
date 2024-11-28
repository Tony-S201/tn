const {
  loadFixture,
  time
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Faucet Nest Contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFaucetFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    // Deploy NEST token
    const Nest = await ethers.getContractFactory("Nest");
    const nest = await Nest.deploy();

    // Deploy NEST faucet contract
    const Faucet = await ethers.getContractFactory("NestFaucet");
    const faucet = await Faucet.deploy(nest.target);

    // Transfer some NEST to the faucet
    await nest.transfer(faucet.target, ethers.parseEther("10000"));

    return { owner, otherAccount, nest, faucet };
  }

  describe("Deployment", function () {

    it("Should set the nest token", async function () {
      const { nest, faucet } = await loadFixture(deployFaucetFixture);
      expect(await faucet.nestToken()).to.be.equal(nest.target);
    });

    it("Should have correct initial balance", async function () {
      const { nest, faucet } = await loadFixture(deployFaucetFixture);
      expect(await nest.balanceOf(faucet.target)).to.be.equal(ethers.parseEther("10000"));
    });

  });

  describe("Token Distribution", function () {
    
    it("Should distribute tokens correctly", async function () {
      const { otherAccount, nest, faucet } = await loadFixture(deployFaucetFixture);

      await faucet.connect(otherAccount).requestTokens();
      expect(await nest.balanceOf(otherAccount.address)).to.be.equal(ethers.parseEther("1000"));
    });

    it("Should not allow requests before cooldown", async function () {
      const { otherAccount, nest, faucet } = await loadFixture(deployFaucetFixture);

      await faucet.connect(otherAccount).requestTokens();
      expect(await nest.balanceOf(otherAccount.address)).to.be.equal(ethers.parseEther("1000"));

      // Move time forwards by 10 hours
      await time.increase(10 * 60 * 60);

      expect(faucet.connect(otherAccount).requestTokens())
        .to.be.revertedWith("Try again later");
    });

    it("Should allow request after cooldown", async function () {
      const { otherAccount, nest, faucet } = await loadFixture(deployFaucetFixture);

      await faucet.connect(otherAccount).requestTokens();
      const initialBalance = await nest.balanceOf(otherAccount.address);
      expect(initialBalance).to.equal(ethers.parseEther("1000"));

      // Move time forwards by 24 hours + 1 second
      await time.increase(24 * 60 * 60 + 1);

      // Request tokens again
      await faucet.connect(otherAccount).requestTokens();
      const finalBalance = await nest.balanceOf(otherAccount.address);
      expect(finalBalance).to.equal(ethers.parseEther("2000"));
    });

    it("Should fail when faucet is empty", async function () {
      const { otherAccount, nest, faucet } = await loadFixture(deployFaucetFixture);

      const initialTotal = await nest.balanceOf(faucet.target)

      // Le faucet a 10000 NEST et distribue 1000 NEST par requête
      // Donc 10 requêtes videront le faucet
      for(let i = 0; i < 10; i++) {
          // Avancer le temps pour permettre plusieurs requêtes
          await time.increase(24 * 60 * 60 + 1);
          await faucet.connect(otherAccount).requestTokens();
      }
  
      // La prochaine demande devrait échouer car le faucet est vide
      await time.increase(24 * 60 * 60 + 1);
      
      await expect(faucet.connect(otherAccount).requestTokens())
          .to.be.revertedWith("Faucet Empty");
    });

    it("Should track cooldown timing correctly", async function () {
      const { otherAccount, faucet } = await loadFixture(deployFaucetFixture);
  
      await faucet.connect(otherAccount).requestTokens();
      const firstRequestTime = await faucet.lastFaucetTime(otherAccount.address);
  
      // Move time forwards by 23 hours
      await time.increase(23 * 60 * 60);
      await expect(faucet.connect(otherAccount).requestTokens())
          .to.be.revertedWith("Try again later");
  
      // Move time forwards by 1 hour + 1 second
      await time.increase(1 * 60 * 60 + 1);
      await faucet.connect(otherAccount).requestTokens();
      
      const secondRequestTime = await faucet.lastFaucetTime(otherAccount.address);
      expect(secondRequestTime).to.be.gt(firstRequestTime);
    });

  });

});
