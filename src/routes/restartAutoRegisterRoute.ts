import express from "express";
import { sleep,createSigner } from "../functions";
import {
    automateRegistration,
    registerAllSteps,
  } from "@intuweb3/exp-node";

import {ethersProvider,blockRange,sleeptime} from "../constants";


const router: express.Router = express.Router();

router.get("/restartautoreg", async (req:any, res:any) => {
    //steven , first do a check to see if vault is complete already or not
    const newVaultAddress = req.query.vaultAddress;
  const ethersSigner = await createSigner(
    process.env.SIGNER || "0x0000000000000000000000000000000000000000",
    ethersProvider
  );
  await automateRegistration(
    newVaultAddress,
    ethersSigner,
    blockRange
  );
  console.log("registering all steps");
  await sleep(sleeptime);
  await registerAllSteps(newVaultAddress, ethersSigner);
  console.log("all steps registered");


});

export default router;