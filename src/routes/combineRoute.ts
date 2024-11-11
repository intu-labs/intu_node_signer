import express from "express";
import { sleep, createSigner } from "../functions";
import { combineSignedTx } from "@intuweb3/exp-node";

import { ethersProvider } from "../constants";

const router: express.Router = express.Router();

router.get("/combinesignedtx", async (req: any, res: any) => {
  //steven , first do a check to see if vault is complete already or not
  const vaultAddress = req.query.vaultAddress;
  const txId = req.query.txId;
  const ethersSigner = await createSigner(
    process.env.SIGNER || "0x0000000000000000000000000000000000000000",
    ethersProvider
  );

  console.log("combining tx for : " + vaultAddress);
  try {
    const result = await combineSignedTx(vaultAddress, txId, ethersSigner);
    res.send(result);
  } catch (error) {
    console.error(error);
  }
});

export default router;
