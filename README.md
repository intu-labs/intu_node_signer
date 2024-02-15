### What is it?

This repo will act as an automated signer to help you create Intu MPC accounts for your users.

Clone the repo, rename the .env.example file to .env, and replace the placeholder with a private key you control.

This is example is setup to run on the SKALE testnet, Chain Id : 974399131.

Run npm i && npm start and it should be up and running!  

### What does it do?

It listens for any Intu vaults created where it's public key is included as a participant in the vault. It will then automatically sign and contribute to the MPC process.  
Then, it will also listen to any transactions created for that MPC's master public address --- and sign those with it's secret share.  

## License
 
The MIT License (MIT)

Copyright (c) 2024 Intu

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
