import {
  preRegistration,
  automateRegistration,
  getVault,
  getUserRegistrationAllInfos,
  getUserPreRegisterInfos,
  registerAllSteps,
  signTx,
  getFilteredUserInitializedLogs,
  automateRotateRegistration,
  registerAllReshareSteps,
  getProposedUser,
  getUniqueHashFromSignature,
  createSeed
} from "@intuweb3/exp-node";
import VaultFactoryJson from "@intuweb3/exp-node/lib/services/web3/contracts/abi/VaultFactory.json";
import VaultJson from "@intuweb3/exp-node/lib/services/web3/contracts/abi/Vault.json";
import ContractInfos from "@intuweb3/exp-node/lib/services/web3/contracts/contractInfos.js";
import { ethers } from "ethers";
require('dotenv').config();

//const provider = new ethers.providers.StaticJsonRpcProvider("https://sepolia.infura.io/v3/f0b33e4b953e4306b6d5e8b9f9d51567");
const provider = new ethers.providers.StaticJsonRpcProvider({url: process.env.RPC_URL || "",skipFetchSetup:true});

const blockTime = 12000; //sepolia

async function createSigner(key: string): Promise<ethers.Signer> {
  const wallet = new ethers.Wallet(key);
  const signer = wallet.connect(provider);
  return signer;
}

function sleep(delay:any) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}
let arrayOfVaults: any[] = [];

async function keepCheckingUntilTrue(vaultAddress:any, userAddress:any): Promise<boolean> {
  console.log("checking if user is preregistered");
  let done: boolean = false;
  while (!done) {
    await sleep(blockTime); //sepolia
    await getUserPreRegisterInfos(vaultAddress, userAddress, provider)
      .then((result) => {
        if (result && result.registered) {
          done = true;
        }
      })
      .catch((err) => console.log(err)); 
  }
  console.log("DONE! ");
  return done;
}

(async () => {
const networkInfo = await provider.getNetwork();
const chainId = await networkInfo.chainId;
let blockRange = 500000; //rpc restrictions sometimes
if (await chainId == 1891 || chainId == 1444673419) {
  blockRange = 2000; //for lightlink and another
}

  const signer = await createSigner(process.env.SIGNER || "0x0000000000000000000000000000000000000000");
  const nodeAddress = await signer.getAddress();
  console.log("nodeaddress : " + nodeAddress + " ready");
  console.log("Start wasm test");
  let wasmTest = await createSeed();
  console.log(wasmTest);
  const contractAddress = ContractInfos(chainId).VaultFactory.address;
  const contract = new ethers.Contract(contractAddress, VaultFactoryJson.abi, provider);

  const addTransactionEventListener = new Proxy(arrayOfVaults, {
    set: function (target, property, value) {
      if (value.length > 5) {
        let vaultAddress = value;
        console.log(arrayOfVaults)
        const contract = new ethers.Contract(vaultAddress, VaultJson.abi, provider);
        console.log("new transaction event listener for : " + vaultAddress);

      contract.on("TransactionProposed", (txId) => {
          console.log("signingTx")
          
        signTx(vaultAddress, txId, signer, "", blockRange).then(async (res) => {
            console.log("signing complete");
          });
        }),
          (error:any) => {
            console.error(error);
          };
      }
      //target[property] = value;
      return true;
    },
  });

  //setup transaction event listeners as soon as as the node is created
  getFilteredUserInitializedLogs(nodeAddress, provider).then((res) => {
    if (res && res.length > 0) {
      //console.log(res.length);
      //console.log(res);
      addTransactionEventListener.push(res[res.length - 1]);
    }
  });



  contract.on("VaultCreated", (vaultAddress, proposedAddresses) => {
    //create new event listener to sign transactions
    console.log("new vault created : " + vaultAddress);
    if(proposedAddresses.includes(nodeAddress)) {
      console.log("add to addresses of vault I'm a part of")
      addTransactionEventListener.push(vaultAddress);
    }
      getVault(vaultAddress, provider, blockRange).then(async (result) => {
        let users = result.users;
        const nodeUser = users.find(user => user.address === nodeAddress);
        if (nodeUser) {
          console.log("Node user found");
          preRegistration(vaultAddress, signer)
            .then(async () => {
          console.log("preregistration complete");
            const result = await keepCheckingUntilTrue(vaultAddress, nodeUser.address);
            if (result) {
            console.log("robotautoregistering - initial registration");
            const latestBlock = await provider.getBlockNumber();
            await sleep(blockTime);
            await automateRegistration(vaultAddress, nodeAddress, signer, blockRange, latestBlock-100).then(async (result) => {
              console.log("registering all steps");
              await registerAllSteps(vaultAddress, signer);
              console.log("Node registration complete")
            });
            }
            })
            .catch((error) => {
          console.error(error);
            });
        }
      });
  }),
    (error:any) => {
      console.error(error);
    };
})();
