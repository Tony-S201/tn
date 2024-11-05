import { type Abi } from "viem";
require('dotenv').config();

export const stakingAddress = process.env.NEXT_PUBLIC_STAKING_ADDRESS ?? "";
export const stNestTokenAddress = process.env.NEXT_PUBLIC_STNEST_ADDRESS ?? "";
export const nestTokenAddress = process.env.NEXT_PUBLIC_NEST_ADDRESS ?? "";

export const stakingAbi: Abi = [];
export const stNestTokenAbi: Abi = [];
export const nestTokenAbi: Abi = [];