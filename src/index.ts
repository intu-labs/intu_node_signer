import {
  preRegistration,
  automateRegistration,
  getUserPreRegisterInfos,
  registerAllSteps,
  signTxWithoutLambda,
  getFilteredUserInitializedLogs,
  automateRotateRegistration,
  registerAllReshareSteps,
  getProposedUser,
  createSeed
} from "@intuweb3/exp-node";
import VaultFactoryJson from "@intuweb3/exp-node/services/web3/contracts/abi/VaultFactory.json";
import VaultJson from "@intuweb3/exp-node/services/web3/contracts/abi/Vault.json";
import ContractInfos from "@intuweb3/exp-node/services/web3/contracts/contractInfos.js";
import { ethers } from "ethers";
import "dotenv/config";

const provider = new ethers.providers.StaticJsonRpcProvider({url:"https://arbitrum-mainnet.infura.io/v3/f0b33e4b953e4306b6d5e8b9f9d51567",skipFetchSetup:true});
//const provider = new ethers.providers.StaticJsonRpcProvider({url:"https://sepolia.infura.io/v3/8f11968261f5401ba9391b5dc629ddfd",skipFetchSetup:true});
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Initial functions / helper functions ~~~~~~~~~~~~~~~~~~~~~~~~~~//
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

const sleeptime = 1000;
let blockRange = 100000;
provider.pollingInterval = 1500;
let arrayOfVaults: any[] = [];


async function createSigner(key: string): Promise<ethers.Signer> {
  const wallet = new ethers.Wallet(key);
  const signer = wallet.connect(provider);
  return signer;
}

function sleep(delay:any) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function keepCheckingUntilTrue(vaultAddress:any, userAddress:any): Promise<boolean> {
  let done: boolean = false;
  while (!done) {
    await sleep(sleeptime);
    await getUserPreRegisterInfos(vaultAddress, userAddress, provider)
      .then((result:any) => {
        if (result && result.registered) {
          done = true;
        }
      })
      .catch((err:any) => console.log(err));
  }
  return done;
}

(async () => {
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Add basic checks for all services / provider / wasm ~~~~~~~~~~~~~~~~~~~~~~~~~~//
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  let wasmtest = await createSeed();
  console.log("wasmTest : ")
  console.log(wasmtest)
  let networkInfo = await provider.getNetwork();
  let chainId = networkInfo.chainId;
  console.log("chainId : " + chainId);
  const signer = await createSigner(process.env.SIGNER || "0x0000000000000000000000000000000000000000");
  const nodeAddress = await signer.getAddress();
  console.log("nodeaddress : " + nodeAddress + " ready");
  let contractAddress = ContractInfos(chainId).VaultFactory.address;
  const contract = new ethers.Contract(contractAddress, VaultFactoryJson.abi, provider);
  console.log("contractAddress : " + contractAddress);

  // function to add a new vault created with vaultAddress to an appropriate array
  const addNewAddressToArray = (vaultAddress: any, proposedAddresses:any) => {
    if(proposedAddresses.includes(nodeAddress)) {
      console.log("add to addresses of vault I'm a part of")
      addEventListenersForRotationAndTransaction.push(vaultAddress);
      } else {
        console.log("add to general addresses I may be a part of in the fuutre")
        addEventListenersForLaterPotentialAddition.push(vaultAddress);
      }
  }

  //add function to get vault created events direct from chain
  const subscribeToVaultCreatedEvents = async () => {
    contract.on("VaultCreated", (vaultAddress, proposedAddresses) => {
      eventEmitter.emit("VaultCreated", [vaultAddress,proposedAddresses]);
    });
  }

    //add moralis function to get vault created Events with Streams API https://docs.moralis.io/streams-api/
  const subscribeToMoralisEvents = async () => {
    const socket = new WebSocket('wss://intudrip.xyz/ws');
    socket.onopen = () => {
        console.log('Connected to WebSocket server');
        // this just confirms things are good
    };
    socket.onmessage = (event) => {
      let eventJson = JSON.parse(event.data);
      if (eventJson.confirmed === false) {
         const newVaultAddress = "0x" + eventJson.logs[0].topic1.slice(26);
         eventEmitter.emit("VaultCreated", [newVaultAddress]);
      }
    }; 
  }

  const checkUserStatus = async (userAddress:string): Promise<boolean> => {
    let apiCheck = `https://somewhere.xyz/${userAddress}`;
    let response = await fetch(apiCheck);
    if (response) { // some other logic based on whatever we are checking
      return false;
    }
    return true;
  }


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Put it all together ~~~~~~~~~~~~~~~~~~~~~~~~~~//
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  const listenForNewVaults = async () => {
    eventEmitter.on('VaultCreated', (res:any) => {
      const newVaultAddress = res[0];
      const proposedAddresses = res[1];
      console.log("new vault created : " + newVaultAddress);

      addNewAddressToArray(newVaultAddress, proposedAddresses);
      const isMatch = proposedAddresses.includes(nodeAddress);
        if (isMatch) {
          console.log("Node address found in  " + newVaultAddress);
          preRegistration(newVaultAddress, signer)
            .then(async () => {
              console.log("preregistration complete - performing final registration now");
                await sleep(sleeptime); //we assume user is done pre-registering by now, otherwise automateRegistration will fail
                await automateRegistration(newVaultAddress, nodeAddress, signer, blockRange).then(async () => {
                  console.log("registering all steps");
                  await sleep(sleeptime);
                await registerAllSteps(newVaultAddress, signer);
                  console.log("all steps registered");
                });
            })
            .catch((error:any) => {
          console.error(error);
            });
        }
    });
  }

  await subscribeToVaultCreatedEvents();
  //await subscribeToMoralisEvents();
  await listenForNewVaultsAndRegister();


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Core functionality for handling storage/etc ~~~~~~~~~~~~~~~~~~~~~~~~~~//
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//


  const addEventListenersForRotationAndTransaction = new Proxy(arrayOfVaults, {
    set: function (target, property, value) {
      if (value.length > 5) {
        let vaultAddress = value;
        const contract = new ethers.Contract(vaultAddress, VaultJson.abi, provider);
        console.log("new transaction event listener for : " + vaultAddress);
        contract.on("TransactionProposed", (txId, transactionInfo) => {
          console.log("signing tx")
        signTxWithoutLambda(vaultAddress, txId, signer).then(async () => {
            console.log("signing complete");
          });
        }),
          (error:any) => {
            console.error(error);
          };
          console.log("new vault user listener for : " + vaultAddress);
          contract.on("VaultAddUserRequested", async () => {
            await(1000)
            let userToAdd = await getProposedUser(vaultAddress, provider);
            if (userToAdd.includes(nodeAddress)) { // if this node is the one being added, do this 
                try {
                  await sleep(sleeptime);
                  preRegistration(vaultAddress, signer).then(async () => {
                    await sleep(sleeptime); //safety sleep
                    try {
                      console.log("robotautoregistering - add user requested");
                      await automateRotateRegistration(vaultAddress, nodeAddress, signer, blockRange).then(async () => {
                        console.log("done with automate rotate reg1")
                        await registerAllReshareSteps(vaultAddress, signer).then(async () => {
                          console.log("done with register all reshare steps")
                        })
                      })
                    } catch (error) {
                      console.log(error);
                    }
                  });
                } catch (error) {
                  console.error("Error occurred:", error);
                };
              } else { //if this node is helping someone else being added, do this
                await sleep(5000); //alternative, keep checking if everyone is preregistered
                  console.log("robotautoregistering - add user requested");
                  await automateRotateRegistration(vaultAddress, nodeAddress, signer).then(async () => {
                    console.log("done with automate rotate reg2")
                    await registerAllReshareSteps(vaultAddress, signer).then(async () => {
                      console.log("done with register all reshare steps")
                    })
                  });
              }
          }),
            (error:any) => {
              console.error(error);
            };

            console.log("new vault rotate user listener for : " + vaultAddress);
          contract.on("VaultRotateUserRequested", async (userToAdd, userToRemove) => {
            if (nodeAddress !== userToRemove) {
                try {
                  const result = await keepCheckingUntilTrue(vaultAddress, userToAdd);
                  if (result) {
                    await sleep(sleeptime); 
                    try {
                      console.log("robotautoregistering - rotate user requested");
                      await automateRotateRegistration(vaultAddress, nodeAddress, signer).then(async () => {
                        console.log("done with automate rotate reg3")

                        await registerAllReshareSteps(vaultAddress, signer).then(async () => {
                          console.log("done with register all reshare steps")
                        })


                      })
                    } catch (error) {
                      console.log(error);
                    }
                  }
                } catch (error) {
                  console.error("Error occurred:", error);
                };
              }
          }),
            (error:any) => {
              console.error(error);
            };
      }
      return true;
    },
  });

  const addEventListenersForLaterPotentialAddition = new Proxy(arrayOfVaults, {
    set: function (target, property, value) {
      if (value.length > 5) {
        let vaultAddress = value;
        const contract = new ethers.Contract(vaultAddress, VaultJson.abi, provider);
        console.log("new vault add user listener for vault : " + vaultAddress);
          contract.on("VaultAddUserRequested", async () => {
            await(sleeptime)
            let userToAdd = await getProposedUser(vaultAddress, provider);
            console.log("proposed user(s) : " + String(userToAdd));
            if (userToAdd.includes(nodeAddress)) {
                try {
                  preRegistration(vaultAddress, signer).then(async () => {
                    await sleep(sleeptime); //need to await the primary user's data being in the db, this is a SKALE blocktime
                    try {
                      console.log("robotautoregistering - add user requested");
                      await automateRotateRegistration(vaultAddress, nodeAddress, signer, blockRange).then(async () => {
                        console.log("Done with automate rotate reg4")
                        await registerAllReshareSteps(vaultAddress, signer).then(async () => {
                          console.log("Done with register all reshare steps")
                        })
                      })
                    } catch (error) {
                      console.log(error);
                    }
                  });
                } catch (error) {
                  console.error("Error occurred:", error);
                };
              }
          }),
            (error:any) => {
              console.error(error);
            };
      }
      return true;
    },
  })


  //setup transaction event listeners as soon as as the node is created
  getFilteredUserInitializedLogs(nodeAddress, provider, blockRange).then((res:any) => {
    if (res && res.length > 0) {
      addEventListenersForRotationAndTransaction.push(res[res.length - 1]);
    }
  });

})();
