### What is it?

This repo will act as an automated signer to help you create Intu MPC accounts for your users.

Clone the repo, rename the .env.example file to .env, and replace the placeholder with a private key you control.

This is example is setup to run on the SKALE testnet, Chain Id : 974399131.

Run npm i && npm start and it should be up and running!  
//////

### What does it do?

It listens for any Intu vaults created where it's public key is included as a participant in the vault. It will then automatically sign and contribute to the MPC process.  
Then, it will also listen to any transactions created for that MPC's master public address --- and sign those with it's secret share.
