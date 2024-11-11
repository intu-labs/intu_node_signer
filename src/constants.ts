import { ethers } from "ethers";

export const EventEmitter = require("events");
export const eventEmitter = new EventEmitter();
export const sleeptime = 1250;
export let blockRange = 200000;
export let arrayOfVaults: any[] = [];
export let special: `0x${string}` = `0x${process.env.SIGNER}`;
export let rpcURL = `https://arbitrum-sepolia.infura.io/v3/${process.env.INFURA_KEY}`;
export let wsURL = `wss://arbitrum-sepolia.infura.io/ws/v3/${process.env.INFURA_KEY}`;
//let rpcURL = `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`;

export const express = require("express");
export const expressApp = express();
export const PORT = 3003;

export const ethersProvider = new ethers.providers.StaticJsonRpcProvider({
  url: rpcURL,
  skipFetchSetup: true,
});