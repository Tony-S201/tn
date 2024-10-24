'use client';

import { createPublicClient, createWalletClient, custom, http, PublicClient, WalletClient } from "viem";
import { polygon, hardhat } from "viem/chains";

const isProduction = process.env.NODE_ENV === "production";

export const publicClient: PublicClient = createPublicClient({
    chain: isProduction ? polygon : hardhat,
    transport: http()
});

export const createWalletClientInstance = (): WalletClient => {
    const walletClient = createWalletClient({
        chain: isProduction ? polygon : hardhat,
        transport: custom(window.ethereum!)
    });
    return walletClient;
};