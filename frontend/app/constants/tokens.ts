import { type Abi } from "viem";
require('dotenv').config();

export const stakingAddress = (process.env.NEXT_PUBLIC_STAKING_ADDRESS ?? "") as `0x${string}`;
export const stNestTokenAddress = (process.env.NEXT_PUBLIC_STNEST_ADDRESS ?? "") as `0x${string}`;
export const nestTokenAddress = (process.env.NEXT_PUBLIC_NEST_ADDRESS ?? "") as `0x${string}`;
export const nestFaucetAddress = (process.env.NEXT_PUBLIC_NEST_FAUCET_ADDRESS ?? "") as `0x${string}`;

export const stakingAbi: Abi = [{
  "inputs": [
    {
      "internalType": "address",
      "name": "_stakingToken",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "_rewardToken",
      "type": "address"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "constructor"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": false,
      "internalType": "address",
      "name": "staker",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  "name": "Staked",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": false,
      "internalType": "address",
      "name": "staker",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "_amount",
      "type": "uint256"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "_rewards",
      "type": "uint256"
    }
  ],
  "name": "Withdraw",
  "type": "event"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "_user",
      "type": "address"
    }
  ],
  "name": "calcRewards",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "rewardToken",
  "outputs": [
    {
      "internalType": "contract IERC20",
      "name": "",
      "type": "address"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  "name": "stakes",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "timestamp",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "_amount",
      "type": "uint256"
    }
  ],
  "name": "staking",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [],
  "name": "stakingToken",
  "outputs": [
    {
      "internalType": "contract IERC20",
      "name": "",
      "type": "address"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "_amount",
      "type": "uint256"
    }
  ],
  "name": "withdraw",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}];
export const stNestTokenAbi: Abi = [{
  "inputs": [],
  "stateMutability": "nonpayable",
  "type": "constructor"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "allowance",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "needed",
      "type": "uint256"
    }
  ],
  "name": "ERC20InsufficientAllowance",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "sender",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "balance",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "needed",
      "type": "uint256"
    }
  ],
  "name": "ERC20InsufficientBalance",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "approver",
      "type": "address"
    }
  ],
  "name": "ERC20InvalidApprover",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "receiver",
      "type": "address"
    }
  ],
  "name": "ERC20InvalidReceiver",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "sender",
      "type": "address"
    }
  ],
  "name": "ERC20InvalidSender",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }
  ],
  "name": "ERC20InvalidSpender",
  "type": "error"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": true,
      "internalType": "address",
      "name": "owner",
      "type": "address"
    },
    {
      "indexed": true,
      "internalType": "address",
      "name": "spender",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "Approval",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": true,
      "internalType": "address",
      "name": "from",
      "type": "address"
    },
    {
      "indexed": true,
      "internalType": "address",
      "name": "to",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "Transfer",
  "type": "event"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "owner",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }
  ],
  "name": "allowance",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "approve",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }
  ],
  "name": "balanceOf",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "decimals",
  "outputs": [
    {
      "internalType": "uint8",
      "name": "",
      "type": "uint8"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "name",
  "outputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "symbol",
  "outputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "totalSupply",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "to",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "transfer",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "from",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "to",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "transferFrom",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
}];
export const nestTokenAbi: Abi = [{
  "inputs": [],
  "stateMutability": "nonpayable",
  "type": "constructor"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "allowance",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "needed",
      "type": "uint256"
    }
  ],
  "name": "ERC20InsufficientAllowance",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "sender",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "balance",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "needed",
      "type": "uint256"
    }
  ],
  "name": "ERC20InsufficientBalance",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "approver",
      "type": "address"
    }
  ],
  "name": "ERC20InvalidApprover",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "receiver",
      "type": "address"
    }
  ],
  "name": "ERC20InvalidReceiver",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "sender",
      "type": "address"
    }
  ],
  "name": "ERC20InvalidSender",
  "type": "error"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }
  ],
  "name": "ERC20InvalidSpender",
  "type": "error"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": true,
      "internalType": "address",
      "name": "owner",
      "type": "address"
    },
    {
      "indexed": true,
      "internalType": "address",
      "name": "spender",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "Approval",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": true,
      "internalType": "address",
      "name": "from",
      "type": "address"
    },
    {
      "indexed": true,
      "internalType": "address",
      "name": "to",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "Transfer",
  "type": "event"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "owner",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }
  ],
  "name": "allowance",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "approve",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }
  ],
  "name": "balanceOf",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "decimals",
  "outputs": [
    {
      "internalType": "uint8",
      "name": "",
      "type": "uint8"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "name",
  "outputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "symbol",
  "outputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "totalSupply",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "to",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "transfer",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "from",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "to",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ],
  "name": "transferFrom",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
}];
export const nestFaucetAbi: Abi = [{
  "inputs": [
    {
      "internalType": "address",
      "name": "_nestToken",
      "type": "address"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "constructor"
},
{
  "inputs": [],
  "name": "COOLDOWN",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "FAUCET_AMOUNT",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  "name": "lastFaucetTime",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "nestToken",
  "outputs": [
    {
      "internalType": "contract IERC20",
      "name": "",
      "type": "address"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "requestTokens",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}];