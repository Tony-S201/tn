# TokenNest

TokenNest is a decentralized staking platform on Polygon.

# Development Guide

## Front-End

Stack:

![NextJS](https://img.shields.io/badge/NextJS-000000?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MaterialUI](https://img.shields.io/badge/MaterialUI-0081CB?style=for-the-badge&logo=mui&logoColor=white)
![RainbowKit](https://img.shields.io/badge/RainbowKit-000000?style=for-the-badge)
![Viem](https://img.shields.io/badge/Viem-Wagmi-blue?style=for-the-badge)

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

Stack:

![NodeJS](https://img.shields.io/badge/NodeJS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![ExpressJS](https://img.shields.io/badge/ExpressJS-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge)

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

Stack:

![Hardhat](https://img.shields.io/badge/Hardhat-FFCC2F?style=for-the-badge)
![Chai](https://img.shields.io/badge/Chai-A30701?style=for-the-badge&logo=chai&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)

**Necessary Environment Variables:**

- PK (Private key to deploy contracts)
- RPC_KEY (RPC key e.g. from Infura or Alchemy)

**Commmands:**

```
// Compile contracts (after each contract edit)
$ yarn hardhat compile

// Run local hardhat node
$ yarn hardhat node

// Run tests
$ yarn hardhat test

// Test Coverage
$ yarn hardhat coverage

// Deploy a contract locally using Ignition module (e.g. Lock.js module for Lock contract)
$ yarn hardhat ignition deploy ./ignition/modules/Lock.js --network localhost

// Deploy the same contract for another network (network need to be configurate in hardhat.config.js file)
$ yarn hardhat ignition deploy ./ignition/modules/Lock.js --network <your-network>
```