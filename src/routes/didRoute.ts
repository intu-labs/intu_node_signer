import express from "express";
//import { Resolver } from "did-resolver";
//import { getResolver as getEthrResolver } from "ethr-did-resolver";
//import { getResolver as getWebResolver } from "web-did-resolver";
//import { getResolver as getKeyResolver } from "key-did-resolver";

const router: express.Router = express.Router();

// Configure resolvers for different DID methods
//const ethrResolver = getEthrResolver({
//  networks: [
//    {
//      name: "mainnet",
//      rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
//    },
//    {
//      name: "ropsten",
//      rpcUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
//    },
//  ],
//});
//
//const webResolver = getWebResolver();
//const keyResolver = getKeyResolver();
//
//const resolver = new Resolver({
//  ...ethrResolver,
//  ...webResolver,
//  ...keyResolver,
//});

// API Endpoint to verify a DID
router.get("/verifydid", async (req: any, res: any) => {
  const didAddress = req.query.didAddress;

  if (!didAddress) {
    return res.status(400).send({ error: "DID address is required" });
  }

  try {
    //const didDocument = await resolver.resolve(didAddress);
    //console.log("DID Document:", didDocument);
    //return res.status(200).send(didDocument);
  } catch (error) {
    console.error("Error resolving DID:", error);
    return res.status(500).send({ error: "Failed to resolve DID" });
  }
});

export default router;
