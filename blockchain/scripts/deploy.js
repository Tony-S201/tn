const hre = require("hardhat");

async function main() {
  // Deploy Nest Token
  const Nest = await hre.ethers.getContractFactory("Nest");
  const nest = await Nest.deploy();
  await nest.waitForDeployment();
  console.log("Nest deployed to:", await nest.getAddress());

  // Deploy StakedNest Token
  const StakedNest = await hre.ethers.getContractFactory("StakedNest");
  const stakedNest = await StakedNest.deploy();
  await stakedNest.waitForDeployment();
  console.log("StakedNest deployed to:", await stakedNest.getAddress());

  // Deploy Faucet
  const NestFaucet = await hre.ethers.getContractFactory("NestFaucet");
  const faucet = await NestFaucet.deploy(await nest.getAddress());
  await faucet.waitForDeployment();
  console.log("Faucet deployed to:", await faucet.getAddress());

  // Deploy Staking
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(
    await nest.getAddress(),
    await stakedNest.getAddress()
  );
  await staking.waitForDeployment();
  console.log("Staking deployed to:", await staking.getAddress());

  // Setup permissions for staking contract and initial transfer of 1,000,000 NEST to faucet contract
  const MINTER_ROLE = await stakedNest.MINTER_ROLE();
  await stakedNest.grantRole(MINTER_ROLE, await staking.getAddress());
  await nest.transfer(await faucet.getAddress(), "1000000000000000000000000");

  console.log("Setup completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});