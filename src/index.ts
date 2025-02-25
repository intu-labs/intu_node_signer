import {
  preRegistration,
  automateRegistration,
  getUserPreRegisterInfos,
  registerAllSteps,
  signTx,
  automateRotateRegistration,
  registerAllReshareSteps,
  createSeed,
  getVault,
} from "@intuweb3/exp-node";
import ContractInfos from "@intuweb3/exp-node/lib/services/web3/contracts/contractInfos.js";
import "dotenv/config";
import { sleep, createSigner, publicClient, walletClient } from "./functions";
import {
  expressApp,
  ethersArbitrumProvider,
  ethersXfiProvider,
  blockRange,
  PORT,
  sleepTimeArbitrum,
  sleepTimeXfi,
} from "./constants";
import healthRoute from "./routes/healthRoute";
import listVaultsRoute from "./routes/listVaultsRoute";
import restartAutoRegisterRoute from "./routes/restartAutoRegisterRoute";
import combineRoute from "./routes/combineRoute";
import signRoute from "./routes/signRoute";
import didRoute from "./routes/didRoute";
import { io } from "socket.io-client";
const socket = io("wss://listener.intu.xyz:8443");

expressApp.use("/", healthRoute);
expressApp.use("/", listVaultsRoute);
expressApp.use("/", restartAutoRegisterRoute);
expressApp.use("/", combineRoute);
expressApp.use("/", signRoute);
expressApp.use("/", didRoute);

if (!process.env.SIGNER) {
  throw new Error("SIGNER environment variable is required");
}
expressApp.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function keepCheckingUntilTrue(
  vaultAddress: string,
  userAddress: string,
  network: string
): Promise<boolean> {
  let retries = 0;
  let maxRetries = 30;
  let provider =
    network === "arbitrum" ? ethersArbitrumProvider : ethersXfiProvider;
  while (retries < maxRetries) {
    let done: boolean = false;
    while (!done) {
      await sleep(600);
      console.log("waiting for new user to preregister");
      try {
        const result = await getUserPreRegisterInfos(
          vaultAddress,
          userAddress,
          provider
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
  const ethersArbitrumSigner = await createSigner(
    process.env.SIGNER || "0x0000000000000000000000000000000000000000",
    ethersArbitrumProvider
  );
  const ethersXfiSigner = await createSigner(
    process.env.SIGNER || "0x0000000000000000000000000000000000000000",
    ethersXfiProvider
  );

  let wasmtest = await createSeed();

  const chainId = await publicClient().getChainId();

  const nodeAddress = walletClient().account?.address;
  if (!nodeAddress) throw new Error("Wallet account not found");

  let contractAddress: `0x${string}` = ContractInfos(chainId).VaultFactory
    .address as `0x${string}`;

  console.log("wasmTest : ", wasmtest ? "success" : "FAILED");
  console.log("chainId : " + chainId);
  console.log("nodeaddress : " + nodeAddress + " ready");
  console.log("contractAddress : " + contractAddress);
  try {
    socket.on("connect", () => {
      console.log("Connected to websocket:", socket.id);
    });
  } catch (e) {
    console.log("Websocket error:", e);
  }
  const listenForNewVaults = async () => {
    socket.on("vaultcreated", async (data) => {
      console.log(data);
      if (data.proposedAddresses) {
        const signer =
          data.network === "arbitrum" ? ethersArbitrumSigner : ethersXfiSigner;
        const isMatch = data.proposedAddresses.includes(nodeAddress);
        if (isMatch) {
          console.log("Node address found in " + data.vaultAddress);
          try {
            await preRegistration(data.vaultAddress, signer);
            console.log(
              "preregistration complete - performing final registration now"
            );
            try {
              const result = await keepCheckingUntilTrue(
                data.vaultAddress,
                data.proposedAddresses[2],
                data.network
              );
              if (result) {
                await automateRegistration(
                  data.vaultAddress,
                  signer,
                  blockRange
                );
                console.log("registering all steps");
                await sleep(
                  data.network === "arbitrum" ? sleepTimeArbitrum : sleepTimeXfi
                );
                await registerAllSteps(data.vaultAddress, signer);
                console.log("all steps registered");
              }
            } catch (error) {
              console.error(error);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
    });
  };

  const listenForTransactions = async () => {
    socket.on("submittedtransaction", async (data) => {
      console.log("Transaction submitted:", data);

      if (data.vaultAddress) {
        const signer =
          data.network === "arbitrum" ? ethersArbitrumSigner : ethersXfiSigner;
        const provider =
          data.network === "arbitrum"
            ? ethersArbitrumProvider
            : ethersXfiProvider;
        await sleep(
          data.network === "arbitrum" ? sleepTimeArbitrum : sleepTimeXfi
        );
        const vault = await getVault(data.vaultAddress, provider);
        const latestTransactionId = vault.transactionCount;

        try {
          await signTx(data.vaultAddress, latestTransactionId, signer);
          console.log("Transaction signed for vault:", data.vaultAddress);
        } catch (error) {
          console.error("Error signing transaction:", error);
        }
      }
    });
  };

  const listenForUserRotation = async () => {
    socket.on("userrotation", async (data) => {
      console.log("User rotation requested:", data);
      const signer =
        data.network === "arbitrum" ? ethersArbitrumSigner : ethersXfiSigner;
      const provider =
        data.network === "arbitrum"
          ? ethersArbitrumProvider
          : ethersXfiProvider;
      if (data.vaultAddress && data.userToAdd) {
        const vaultAddress = data.vaultAddress;
        const vaultInfo = await getVault(vaultAddress, provider);
        const usersArray = vaultInfo.users.map((user: any) => user.userAddress);
        if (data.userToAdd.includes(nodeAddress)) {
          try {
            await preRegistration(data.vaultAddress, signer);
            await sleep(
              data.network === "arbitrum" ? sleepTimeArbitrum : sleepTimeXfi
            );
            await automateRotateRegistration(
              data.vaultAddress,
              signer,
              blockRange
            );
            await registerAllReshareSteps(data.vaultAddress, signer);
          } catch (error) {
            console.error("Error handling user rotation:", error);
          }
        } else if (usersArray.includes(nodeAddress)) {
          await sleep(
            data.network === "arbitrum" ? sleepTimeArbitrum : sleepTimeXfi
          );
          console.log("robotautoregistering - add user requested");
          try {
            await automateRotateRegistration(vaultAddress, signer);
            console.log("done with automate rotate reg2");
            await registerAllReshareSteps(vaultAddress, signer);
            console.log("done with register all reshare steps");
          } catch (error) {
            console.error(error);
          }
        }
      }
    });
  };

  await listenForNewVaults();
  await listenForTransactions();
  await listenForUserRotation();

  //this was the old method to gather all the vaults and start listening to them.
  //const logs = await getFilteredUserInitializedLogs(
  //  nodeAddress,
  //  ethersProvider,
  //  blockRange
  //);
  //console.log(logs.length);
  //if (logs && logs.length > 0) {
  //  for (let i = 0; i < Math.min(logs.length, 25); i++) {
  //    addEventListenersForRotationAndTransaction.push(logs[i]);
  //  }
  //}
})();
