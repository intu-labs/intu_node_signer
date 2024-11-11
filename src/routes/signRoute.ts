import express from "express";
import { sleep,createSigner } from "../functions";
import {
    signTx
  } from "@intuweb3/exp-node";

  import {ethersProvider} from "../constants";


const router: express.Router = express.Router();

router.get("/signtx", async (req:any, res:any) => {
    //steven , first do a check to see if vault is complete already or not
    const vaultAddress = req.query.vaultAddress;
    const txId = req.query.txId;
  const ethersSigner = await createSigner(
    process.env.SIGNER || "0x0000000000000000000000000000000000000000",
    ethersProvider
  );

  console.log("signing tx for : " + vaultAddress);
    try {
      await signTx(vaultAddress, txId, ethersSigner);
      console.log("signing complete");
    } catch (error) {
      console.error(error);
    }
});

export default router;