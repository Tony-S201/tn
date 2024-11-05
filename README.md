# TokenNest

TokenNest is a decentralized staking platform on Polygon.

# Development Guide

## Front-End

The Front-End stack is:
- NextJS (React)
- TailwindCSS
- MaterialUI
- RainbowKit
- Viem (Wagmi)

**Necessary Environment Variables:**
- NEXT_PUBLIC_WALLET_CONNECT_ID

**Start Front-End:**

```
$ yarn run dev
```

**Build app for production:**

```
$ yarn run build
```

## Backend

The Back-End stack is:
- NodeJS
- ExpressJS
- MongoDB as DB
- Mongoose as ODM

**Required:**
- Install mongodb on your machine
- Create a DATABASE using mongo commands

**Necessary Environment Variables:**
- PORT
- MONGO_URL

**Start Node Server:**
```
$ npm install (first time)
$ node app.js
```

## Blockchain

The Blockchain stack is:

- Hardhat
- Chai (smart contract unit tests)
- Hardhat Ignition for contract deployment
- Solidity

**Necessary Environment Variables:**

- PK (Private key to deploy contracts)
- RPC_KEY (RPC key e.g. from Infura or Alchemy)

**Commmands:**

```
// Compile contracts (after each contract edit)
$ yarn hardhat compile

// Run tests
$ yarn hardhat test

// Test Coverage
$ yarn hardhat coverage

// Deploy a contract locally using Ignition module (e.g. Lock.js module for Lock contract)
$ yarn hardhat ignition deploy ./ignition/modules/Lock.js --network localhost

// Deploy the same contract for another network (network need to be configurate in hardhat.config.js file)
$ yarn hardhat ignition deploy ./ignition/modules/Lock.js --network <your-network>
```