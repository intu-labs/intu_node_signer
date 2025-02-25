import { ethers } from "ethers";

export const EventEmitter = require("events");
export const eventEmitter = new EventEmitter();
export const sleepTimeArbitrum = 1500;
export const sleepTimeXfi = 5500;
export let arrayOfVaults: any[] = [];
export let special: `0x${string}` = `0x${process.env.SIGNER}`;
export let rpcURL = process.env.ALCHEMY_RPC_URL || "";
export let wsURL = process.env.ALCHEMY_WSS_URL || "";
export const express = require("express");
export const expressApp = express();
export const PORT = 3003;

export const ethersArbitrumProvider =
  new ethers.providers.StaticJsonRpcProvider({
    url: rpcURL,
    skipFetchSetup: true,
  });

export const ethersXfiProvider = new ethers.providers.StaticJsonRpcProvider({
  url: rpcURL,
  skipFetchSetup: true,
});
