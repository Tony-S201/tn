'use client';

import { createPublicClient, createWalletClient, custom, http, PublicClient, WalletClient } from "viem";
import { polygon, hardhat } from "viem/chains";

const isProduction = process.env.NODE_ENV === "production";
export const currentChain = isProduction ? polygon : hardhat;

export const publicClient: PublicClient = createPublicClient({
    chain: currentChain,
    transport: http()
});

export const createWalletClientInstance = (): WalletClient => {
    const walletClient = createWalletClient({
        chain: currentChain,
        transport: custom(window.ethereum!)
    });
    return walletClient;
};

export const writeContract = async (walletClient: WalletClient, params: any) => {
    return walletClient.writeContract({
        ...params,
        chain: currentChain
    });
};