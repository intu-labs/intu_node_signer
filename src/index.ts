import { createPublicClient, createWalletClient, http, webSocket } from "viem";
import { arbitrumSepolia, arbitrum } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  preRegistration,
  automateRegistration,
  getUserPreRegisterInfos,
  registerAllSteps,
  signTx,
  getFilteredUserInitializedLogs,
  automateRotateRegistration,
  registerAllReshareSteps,
  getProposedUser,
  createSeed,
} from "@intuweb3/exp-node";
import VaultFactoryJson from "@intuweb3/exp-node/services/web3/contracts/abi/VaultFactory.json";
import VaultJson from "@intuweb3/exp-node/services/web3/contracts/abi/Vault.json";
import ContractInfos from "@intuweb3/exp-node/services/web3/contracts/contractInfos.js";
import "dotenv/config";
import { ethers } from "ethers";

const EventEmitter = require("events");
const eventEmitter = new EventEmitter();
const sleeptime = 1500;
let blockRange = 100000;
let arrayOfVaults: any[] = [];
let special: `0x${string}` = `0x${process.env.SIGNER}`;
let rpcURL = `https://arbitrum-sepolia.infura.io/v3/${process.env.INFURA_KEY}`;
let wsURL = `wss://arbitrum-sepolia.infura.io/ws/v3/${process.env.INFURA_KEY}`;
//let rpcURL = `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`;

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(rpcURL),
});

const wsPublicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: webSocket(wsURL),
});

const account = privateKeyToAccount(special);
let walletClient = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http(rpcURL),
});

const ethersProvider = new ethers.providers.StaticJsonRpcProvider({
  url: rpcURL,
  skipFetchSetup: true,
});

function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function createSigner(key: string): Promise<ethers.Signer> {
  const wallet = new ethers.Wallet(key);
  const signer = await wallet.connect(ethersProvider);
  return signer;
}

async function keepCheckingUntilTrue(
  vaultAddress: string,
  userAddress: string
): Promise<boolean> {
  let retries = 0;
  let maxRetries = 30;
  while (retries < maxRetries) {
    let done: boolean = false;
    while (!done) {
      await sleep(sleeptime);
      try {
        const result = await getUserPreRegisterInfos(
          vaultAddress,
          userAddress,
          ethersProvider
        );
        if (result && result.registered) {
          done = true;
        }
        retries++;
      } catch (err) {
        console.log(err);
      }
    }
    return done;
  }
  return false;
}

(async () => {
  const ethersSigner = await createSigner(
    process.env.SIGNER || "0x0000000000000000000000000000000000000000"
  );

  let wasmtest = await createSeed();
  console.log("wasmTest : ", wasmtest);

  const chainId = await publicClient.getChainId();
  console.log("chainId : " + chainId);

  const nodeAddress = walletClient.account.address;
  console.log("nodeaddress : " + nodeAddress + " ready");

  let contractAddress: `0x${string}` = ContractInfos(chainId).VaultFactory
    .address as `0x${string}`;
  console.log("contractAddress : " + contractAddress);

  const addNewAddressToArray = (
    vaultAddress: string,
    proposedAddresses: string[]
  ) => {
    if (proposedAddresses.includes(nodeAddress)) {
      console.log("add to addresses of vault I'm a part of");
      addEventListenersForRotationAndTransaction.push(vaultAddress);
    } else {
      console.log("add to general addresses I may be a part of in the future");
      addEventListenersForLaterPotentialAddition.push(vaultAddress);
    }
  };

  const subscribeToVaultCreatedEvents = async () => {
    wsPublicClient.watchContractEvent({
      address: contractAddress,
      abi: VaultFactoryJson.abi,
      eventName: "VaultCreated",
      onLogs: (logs) => {
        for (const log of logs) {
          let anyLog = log as any;
          eventEmitter.emit("VaultCreated", [
            anyLog.args.vaultAddress,
            anyLog.args._proposedAddresses,
          ]);
        }
      },
    });
  };

  const listenForNewVaults = async () => {
    eventEmitter.on("VaultCreated", async (res: any) => {
      const newVaultAddress = res[0];
      const proposedAddresses = res[1];
      console.log("new vault created : " + newVaultAddress);
      addNewAddressToArray(newVaultAddress, proposedAddresses);

      const isMatch = proposedAddresses.includes(nodeAddress);
      if (isMatch) {
        console.log("Node address found in " + newVaultAddress);
        try {
          await preRegistration(newVaultAddress, ethersSigner);
          console.log(
            "preregistration complete - performing final registration now"
          );
          await sleep(sleeptime);
          await automateRegistration(newVaultAddress, ethersSigner, blockRange);
          console.log("registering all steps");
          await sleep(sleeptime);
          await registerAllSteps(newVaultAddress, ethersSigner);
          console.log("all steps registered");
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  await subscribeToVaultCreatedEvents();
  await listenForNewVaults();
  const addEventListenersForRotationAndTransaction = new Proxy(arrayOfVaults, {
    set: function (target, property, value) {
      if (value.length > 5) {
        let vaultAddress = value;
        console.log("new transaction event listener for : " + vaultAddress);

        wsPublicClient.watchContractEvent({
          address: vaultAddress,
          abi: VaultJson.abi,
          eventName: "TransactionProposed",
          onLogs: async (logs) => {
            for (const log of logs) {
              let anyLog = log as any;
              console.log("signing tx for : " + vaultAddress);
              if (anyLog.args) {
                try {
                  console.log(anyLog.args.txId);
                  await signTx(vaultAddress, anyLog.args.txId, ethersSigner);
                  console.log("signing complete");
                } catch (error) {
                  console.error(error);
                }
              }
            }
          },
        });

        console.log("new vault user listener for : " + vaultAddress);

        wsPublicClient.watchContractEvent({
          address: vaultAddress,
          abi: VaultJson.abi,
          eventName: "VaultAddUserRequested",
          onLogs: async () => {
            await sleep(1000);
            let userToAdd = await getProposedUser(vaultAddress, ethersProvider);
            if (userToAdd.includes(nodeAddress)) {
              try {
                await sleep(sleeptime);
                await preRegistration(vaultAddress, ethersSigner);
                await sleep(sleeptime);
                console.log("robotautoregistering - add user requested");
                await automateRotateRegistration(
                  vaultAddress,
                  ethersSigner,
                  blockRange
                );
                console.log("done with automate rotate reg1");
                await registerAllReshareSteps(vaultAddress, ethersSigner);
                console.log("done with register all reshare steps");
              } catch (error) {
                console.error("Error occurred:", error);
              }
            } else {
              await sleep(5000);
              console.log("robotautoregistering - add user requested");
              try {
                await automateRotateRegistration(vaultAddress, ethersSigner);
                console.log("done with automate rotate reg2");
                await registerAllReshareSteps(vaultAddress, ethersSigner);
                console.log("done with register all reshare steps");
              } catch (error) {
                console.error(error);
              }
            }
          },
        });

        console.log("new vault rotate user listener for : " + vaultAddress);

        wsPublicClient.watchContractEvent({
          address: vaultAddress,
          abi: VaultJson.abi,
          eventName: "VaultRotateUserRequested",
          onLogs: async (logs) => {
            for (const log of logs) {
              let anyLog = log as any;
              if (
                anyLog &&
                nodeAddress !== anyLog.args.userToRemove &&
                anyLog.args.userToAdd
              ) {
                try {
                  const result = await keepCheckingUntilTrue(
                    vaultAddress,
                    anyLog.args.userToAdd
                  );
                  if (result) {
                    await sleep(sleeptime);
                    try {
                      console.log(
                        "robotautoregistering - rotate user requested"
                      );
                      await automateRotateRegistration(
                        vaultAddress,
                        ethersSigner
                      );
                      console.log("done with automate rotate reg3");
                      await registerAllReshareSteps(vaultAddress, ethersSigner);
                      console.log("done with register all reshare steps");
                    } catch (error) {
                      console.log(error);
                    }
                  }
                } catch (error) {
                  console.error("Error occurred:", error);
                }
              }
            }
          },
        });
      }
      return true;
    },
  });

  const addEventListenersForLaterPotentialAddition = new Proxy(arrayOfVaults, {
    set: function (target, property, value) {
      if (value.length > 5) {
        let vaultAddress = value;
        console.log("new vault add user listener for vault : " + vaultAddress);

        wsPublicClient.watchContractEvent({
          address: vaultAddress,
          abi: VaultJson.abi,
          eventName: "VaultAddUserRequested",
          onLogs: async () => {
            await sleep(sleeptime);
            let userToAdd = await getProposedUser(vaultAddress, ethersProvider);
            console.log("proposed user(s) : " + String(userToAdd));
            if (userToAdd.includes(nodeAddress)) {
              try {
                await preRegistration(vaultAddress, ethersSigner);
                await sleep(sleeptime);
                console.log("robotautoregistering - add user requested");
                await automateRotateRegistration(
                  vaultAddress,
                  ethersSigner,
                  blockRange
                );
                console.log("Done with automate rotate reg4");
                await registerAllReshareSteps(vaultAddress, ethersSigner);
                console.log("Done with register all reshare steps");
              } catch (error) {
                console.error("Error occurred:", error);
              }
            }
          },
        });
      }
      return true;
    },
  });
  const logs = await getFilteredUserInitializedLogs(
    nodeAddress,
    ethersProvider,
    blockRange
  );
  if (logs && logs.length > 0) {
    addEventListenersForRotationAndTransaction.push(logs[logs.length - 1]);
  }
})();
