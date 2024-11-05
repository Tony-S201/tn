// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("StakingModule", (m) => {
  const nestTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const stakingTokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const c = m.contract("Staking", [nestTokenAddress, stakingTokenAddress]);
  return { c };
});
