import express from "express";
import { createSigner } from "../functions";
import {ethersProvider} from "../constants";

const router: express.Router = express.Router();

router.get("/health", async (req:any, res:any) => {
  const ethersSigner = await createSigner(
    process.env.SIGNER || "0x0000000000000000000000000000000000000000",
    ethersProvider
  );
  let address = await ethersSigner.getAddress();
  res.send("Server is healthy! Node signer address: " + address);
});

export default router;