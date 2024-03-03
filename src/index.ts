import {
  preRegistration,
  automateRegistration,
  getVault,
  getUserRegistrationAllInfos,
  getUserPreRegisterInfos,
  registerAllSteps,
  signTx,
  _getFilteredUserInitializedLogs,
} from "@intuweb3/exp-node";
import VaultFactoryJson from "@intuweb3/exp-node/lib/services/web3/contracts/abi/VaultFactory.json";
import VaultJson from "@intuweb3/exp-node/lib/services/web3/contracts/abi/Vault.json";
import ContractInfos from "@intuweb3/exp-node/lib/services/web3/contracts/contractInfos";
import { ethers } from "ethers";
import "dotenv/config";

const provider = new ethers.providers.JsonRpcProvider("https://testnet.skalenodes.com/v1/juicy-low-small-testnet");

async function createSigner(key: string): Promise<ethers.Signer> {
  const wallet = new ethers.Wallet(key);
  const signer = wallet.connect(provider);
  return signer;
}

function sleep(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}
let arrayOfVaults: any[] = [];

async function keepCheckingUntilTrue(vaultAddress, userAddress): Promise<boolean> {
  console.log("checking if user is preregistered");
  let done: boolean = false;
  while (!done) {
    await sleep(5000);
    await getUserPreRegisterInfos(vaultAddress, userAddress, provider)
      .then((result) => {
        if (result && result.registered) {
          done = true;
        }
      })
      .catch((err) => console.log(err));
  }
  return done;
}

(async () => {
  //create listener
  const signer = await createSigner(process.env.SIGNER || "0x0000000000000000000000000000000000000000");
  const nodeAddress = await signer.getAddress();
  console.log("nodeaddress : " + nodeAddress + " ready");

  const addTransactionEventListener = new Proxy(arrayOfVaults, {
    set: function (target, property, value) {
      if (property === "length") {
        let vaultAddress = arrayOfVaults[arrayOfVaults.length - 1];
        const contract = new ethers.Contract(vaultAddress, VaultJson.abi, provider);
        contract.on("TransactionProposed", (txId, transactionInfo) => {
          signTx(vaultAddress, txId, signer).then(async (res) => {
            console.log("signing complete");
          });
        }),
          (error) => {
            console.error(error);
          };
      }
      target[property] = value;
      return true;
    },
  });

  _getFilteredUserInitializedLogs(nodeAddress, provider).then((res) => {
    if (res && res.length > 0) {
      addTransactionEventListener.push(res[res.length - 1]);
    }
  });

  let contractAddress = ContractInfos(1444673419).VaultFactory.address;
  const contract = new ethers.Contract(contractAddress, VaultFactoryJson.abi, provider);
  contract.on("VaultCreated", (vaultAddress) => {
    //create new event listener to sign transactions
    addTransactionEventListener.push(vaultAddress);
    getVault(vaultAddress, provider).then(async (result) => {
      let users = result.users;
      for (let i = 0; i < users.length; i++)
        if (users[i].address === nodeAddress) {
          preRegistration(vaultAddress, signer)
            .then(async () => {
              try {
                const result = await keepCheckingUntilTrue(vaultAddress, users[2].address);
                if (result) {
                  await sleep(5000); //need to await the primary user's data being in the db, this is a SKALE blocktime
                  try {
                    await automateRegistration(vaultAddress, nodeAddress, signer).then(async (result) => {
                      let isRegistered = await getUserRegistrationAllInfos(vaultAddress, nodeAddress, provider);
                      console.log("registered: " + isRegistered.registered);
                      if (isRegistered.registered === false) {
                        await registerAllSteps(vaultAddress, signer);
                      }
                    });
                  } catch (error) {
                    console.log(error);
                  }
                }
              } catch (error) {
                console.error("Error occurred:", error);
              }
            })
            .catch((error) => {
              console.error(error);
            });
        } else {
          //console.log("no match, do nothing");
        }
    });
  }),
    (error) => {
      console.error(error);
    };
})();
