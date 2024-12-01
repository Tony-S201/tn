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
- NEXT_PUBLIC_API_URL

Configuration .env file:
```bash
# Put your node server backend URL
NEXT_PUBLIC_API_URL="http://localhost:5000"
# Put your wallet connect ID
NEXT_PUBLIC_WALLET_CONNECT_ID="myid"
```

Setup:
```bash
# Install dependencies
$ yarn install
# or
$ npm install
```
```bash
# Start application
$ yarn run dev
# or
$ npm run dev
```

**Build app for production:**

```bash
$ yarn run build
# or
$ npm run build
```

## Backend

Stack:

![NodeJS](https://img.shields.io/badge/NodeJS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![ExpressJS](https://img.shields.io/badge/ExpressJS-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge)

Requirements:
- Node
- Mongodb

Create a database using mongodb:
```bash
# Start mongod service
$ sudo service mongod start

# Enter in mongo
$ mongo

# Create a database
> use my_database_name
```

Configuration .env file:
```bash
# Default 5000
PORT=
# You can use "mongo" command to get the ip_address
# You can use "show dbs" command into mongo to get the database name
MONGO_URL="mongodb://ip_address:27017/my_database_name"
# Default value "http://localhost:3000"
FRONT_URL=""
```

Setup:
```bash
# Dependencies installation
$ npm install

# Run server application
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

```bash
# Compile contracts (after each contract edit)
$ yarn hardhat compile

# Run local hardhat node
$ yarn hardhat node

# Run tests
$ yarn hardhat test

# Test Coverage
$ yarn hardhat coverage
```

**How to start:**

```bash
# Run the local node
$ yarn hardhat node

# Compile contracts
$ yarn hardhat compile

# Deployment command
$ yarn hardhat run scripts/deploy.js --network localhost
```