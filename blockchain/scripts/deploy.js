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

  // Deploy LiquidityPool
  const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(await nest.getAddress());
  await liquidityPool.waitForDeployment();
  console.log("LiquidityPool deployed to:", await liquidityPool.getAddress());

  /* SETUP, PERMISSIONS, INITIAL TRANSFER */

  // Setup permissions for staking contract and initial transfer of 1,000,000 NEST from deployer to faucet contract
  const MINTER_ROLE = await stakedNest.MINTER_ROLE();
  await stakedNest.grantRole(MINTER_ROLE, await staking.getAddress());
  await nest.transfer(await faucet.getAddress(), "1000000000000000000000000");

  // Add initial rewards from deployer to staking contract
  const initialRewards = ethers.parseEther("1000000"); // 1,000,000 NEST tokens to Staking contract for rewards
  await nest.approve(staking.target, initialRewards);
  await staking.addRewards(initialRewards);

  // Setup approvals for LiquidityPool
  // Approve LiquidityPool to spend NEST tokens (set to max uint256 for simplicity)
  const maxApproval = ethers.MaxUint256;
  await nest.approve(liquidityPool.target, maxApproval);
  console.log("LiquidityPool approved to spend NEST tokens");

  // Add initial liquidity to the pool (optional)
  const initialLiquidityNest = ethers.parseEther("10"); // 10 NEST
  const initialLiquidityETH = ethers.parseEther("0.01"); // 0.01 ETH
  await nest.approve(liquidityPool.target, initialLiquidityNest);
  await liquidityPool.mint(deployer.address, { value: initialLiquidityETH });
  console.log("Initial liquidity added to the pool");

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
    const liquidityPoolAbi = JSON.parse(
      fs.readFileSync('artifacts/contracts/LiquidityPool.sol/LiquidityPool.json')
    ).abi;

    // Create new tokens.ts content
    const tokensContent = `import { type Abi } from "viem";

    export const stakingAddress = "${await staking.getAddress()}" as \`0x\${string}\`;
    export const stNestTokenAddress = "${await stakedNest.getAddress()}" as \`0x\${string}\`;
    export const nestTokenAddress = "${await nest.getAddress()}" as \`0x\${string}\`;
    export const nestFaucetAddress = "${await faucet.getAddress()}" as \`0x\${string}\`;
    export const liquidityPoolAddress = "${await liquidityPool.getAddress()}" as \`0x\${string}\`;
    
    export const stakingAbi: Abi = ${JSON.stringify(stakingAbi, null, 2)};
    export const stNestTokenAbi: Abi = ${JSON.stringify(stakedNestAbi, null, 2)};
    export const nestTokenAbi: Abi = ${JSON.stringify(nestAbi, null, 2)};
    export const nestFaucetAbi: Abi = ${JSON.stringify(faucetAbi, null, 2)};
    export const liquidityPoolAbi: Abi = ${JSON.stringify(liquidityPoolAbi, null, 2)};
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