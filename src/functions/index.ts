import { ethers } from "ethers";
import {
  createPublicClient,
  createWalletClient,
  http,
  webSocket,
  PublicClient,
} from "viem";
import { arbitrumSepolia, arbitrum } from "viem/chains";
import { wsURL, rpcURL, special } from "../constants";
import { privateKeyToAccount } from "viem/accounts";

export async function createSigner(
  key: string,
  ethersProvider: ethers.providers.StaticJsonRpcProvider
): Promise<ethers.Signer> {
  const wallet = new ethers.Wallet(key);
  const signer = await wallet.connect(ethersProvider);
  return signer;
}

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(rpcURL),
});

export const wsPublicClient: PublicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: webSocket(wsURL, {
    keepAlive: {
      interval: 300000,
    },
    reconnect: {
      delay: 5000,
      attempts: 5,
    },
    timeout: 30000,
  }),
});

export function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export const viemAccount = () => {
  return privateKeyToAccount(special);
};

export const walletClient = () => {
  const account = privateKeyToAccount(special);
  return createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(rpcURL),
  });
};
