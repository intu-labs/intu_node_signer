import express from "express";
import { sleep,createSigner } from "../functions";
import {
    automateRegistration,
    registerAllSteps,
    getFilteredUserInitializedLogs
  } from "@intuweb3/exp-node";

import {ethersProvider,blockRange} from "../constants";


const router: express.Router = express.Router();

router.get("/listvaults", async (req:any, res:any) => {
    //steven , first do a check to see if vault is complete already or not

    const ethersSigner = await createSigner(
        process.env.SIGNER || "0x0000000000000000000000000000000000000000",
        ethersProvider
      );
      let nodeAddress = await ethersSigner.getAddress();
    const logs = await getFilteredUserInitializedLogs(
        nodeAddress,
        ethersProvider,
        blockRange
      );
      res.send(logs);


});

export default router;