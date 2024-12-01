const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {

  /* DEPLOYMENT PART */

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

  /* WRITE IN CONST FILE PART - LOCAL ONLY */
  if(process.env.NODE_ENV !== 'production') {

    // Get ABIs from artifacts
    const nestAbi = JSON.parse(
      fs.readFileSync('artifacts/contracts/Nest.sol/Nest.json')
    ).abi;
    const stakedNestAbi = JSON.parse(
      fs.readFileSync('artifacts/contracts/StakedNest.sol/StakedNest.json')
    ).abi;
    const stakingAbi = JSON.parse(
      fs.readFileSync('artifacts/contracts/Staking.sol/Staking.json')
    ).abi;
    const faucetAbi = JSON.parse(
      fs.readFileSync('artifacts/contracts/NestFaucet.sol/NestFaucet.json')
    ).abi;

    // Create new tokens.ts content
    const tokensContent = `import { type Abi } from "viem";

    export const stakingAddress = "${await staking.getAddress()}" as \`0x\${string}\`;
    export const stNestTokenAddress = "${await stakedNest.getAddress()}" as \`0x\${string}\`;
    export const nestTokenAddress = "${await nest.getAddress()}" as \`0x\${string}\`;
    export const nestFaucetAddress = "${await faucet.getAddress()}" as \`0x\${string}\`;
    
    export const stakingAbi: Abi = ${JSON.stringify(stakingAbi, null, 2)};
    export const stNestTokenAbi: Abi = ${JSON.stringify(stakedNestAbi, null, 2)};
    export const nestTokenAbi: Abi = ${JSON.stringify(nestAbi, null, 2)};
    export const nestFaucetAbi: Abi = ${JSON.stringify(faucetAbi, null, 2)};
    `;
  
    // Write to tokens.ts
    const tokensPath = path.join(__dirname, '../../frontend/app/constants/tokens.ts');
    fs.writeFileSync(tokensPath, tokensContent);
    console.log("Tokens file updated successfully!");
  }

  console.log("Setup completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});