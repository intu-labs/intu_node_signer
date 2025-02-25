import { ethers } from "ethers";
import {
  createPublicClient,
  createWalletClient,
  http,
  webSocket,
  PublicClient,
  WalletClient,
  defineChain,
} from "viem";
import { arbitrumSepolia, arbitrum } from "viem/chains";
import { wsURL, rpcURL, special } from "../constants";
import { privateKeyToAccount } from "viem/accounts";

export function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export const viemAccount = () => {
  return privateKeyToAccount(special);
};

const account = privateKeyToAccount(special);
export async function createSigner(
  key: string,
  ethersProvider: ethers.providers.StaticJsonRpcProvider
): Promise<ethers.Signer> {
  const wallet = new ethers.Wallet(key);
  const signer = await wallet.connect(ethersProvider);
  return signer;
}

//export const publicClient = createPublicClient({
//  chain: arbitrumSepolia,
//  transport: http(rpcURL),
//});
export const publicClient = (): PublicClient => {
  return createPublicClient({
    chain: defineChain({
      name: "chain",
      id: 4157,
      rpcUrls: {
        default: {
          http: [rpcURL],
        },
      },
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
    }),
    transport: http(rpcURL),
  });
};

export let wsPublicClient: PublicClient;

export const initializeWebSocket = (): PublicClient => {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: webSocket(wsURL, {
      keepAlive: {
        interval: 15000,
      },
      reconnect: {
        delay: 5000,
        attempts: 10,
      },
    }),
  });
};

//export const walletClient = () => {
//  const account = privateKeyToAccount(special);
//  return createWalletClient({
//    account,
//    chain: arbitrumSepolia,
//    transport: http(rpcURL),
//  });
//};

export const walletClient = (): WalletClient => {
  return createWalletClient({
    account,
    chain: defineChain({
      name: "chain",
      id: 4157,
      rpcUrls: {
        default: {
          http: [rpcURL],
        },
      },
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
    }),
    transport: http(rpcURL),
  });
};
