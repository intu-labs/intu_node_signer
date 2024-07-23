<p align="center">
<img src="Door_INTU_Grad_Trans.png" alt="drawing" width="200" style="margin:0 auto; display:block;"/>
</p>

# :robot: Automated CoSigner
INTU requires a minimum of 3 participants or factors to create an account. Automated co-signers allow your dApp or platform to safely co-create accounts with end-users, and later co-sign transactions and methods.

This allows a broad flexibility to define custody, signing, recovery, and security experiences. A few examples include: 

- One-click Account Creation for end-users
- Non-custodial customer service & account recovery
- Policy enforcement by co-signer, including KYC, spending limits, security checks

Because INTU accounts are dynamic, end-user accounts can evolve over time. Applications can now introduce new features and policies, encourage self-custody, sponsor gas, etc over time, rather than be limited by "starter" accounts at customer acquisition. 

## :tada: What is it?
This repo will act as an automated co-signer to help your application or platform co-create Intu Accounts for your users.

## :rocket: Getting Started

1. Clone the repo
2. Rename the ```.env.example``` file to ```.env```
3. In ```.env```file, Replace ```"signerprivatekey"``` with a private key you control. This should be an EVM-compatible ECDSA private key.

:no_entry: **USE A TEST PRIVATE KEY - DO NOT USE A PRIVATE KEY ACTIVELY USED ON MAINNET** :no_entry:

4. Run ```npm i && npm run allwebpack```


### :alien: Why SKALE?
This example is set to run on the SKALE Testnet. Any EVM network can be supported.
```
Chain ID : 974399131
```
SKALE is an ideal network for creating and using INTU accounts: 
- Gasless
- Near instant finality
- Built on/for Ethereum

**INTU accounts created and utilized on SKALE can be used form transactions for any EVM-compatible chain.**  
SKALE is used for participant communication and data storage, and the completed transaction can be broadcast to any EVM-compatible chain.
 
This application uses a SKALE Testnet sFUEL distributor run by INTU, which may not be always available. 

If you wish to set up your own sFuel distributor, more information can be found [here](https://docs.skale.network/infrastructure/sfuel-api-distribution).

## :wrench: What does this code actually do?
The Automated Co-Signer listens for the creation of new INTU accounts that include its public address. The Co-Signer will then automatically sign and participate in the Account Generation process.
  
Once the account is created, it will continue to listen for signature requests from INTU Accounts it helped create. The Co-signer will respond to signature requests after validation with a partial signature.

```Note: This example is very basic. This response to signature request is an opportunity to verify and validate additional parameters, such as spending limits or proof-of-humanity```

The end-user's device (SDK) will aggregate the partial signatures, and once formed, broadcast to the destination network.

## :fire: How is this different than other solutions?
- The account is dynamic! Evolve your end-user to full self-custody, removing or reduce dependence on Automated Co-signers
- Using Automated Co-signers allows your application to enforce KYC, protect against bots and spam, or enforce other application-specific policies, while keeping end-user account authority
- INTU provides technology, not a service! Build the account solution directly into your product.
- Scalability & Performance is in your hands beyond INTU baseline! INTU is already fast, but if your project requires more, you can easily scale Co-signer infrastructure. 

### :question: Questions? 
:email: <dev@intu.xyz> :email:

[🏮 discord 🏮](https://discord.gg/sc9SjTewph)

### License
 
The MIT License (MIT)

Copyright (c) 2024 Intu

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
