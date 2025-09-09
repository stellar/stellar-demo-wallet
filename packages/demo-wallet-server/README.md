# Stellar Demo Wallet Server

This Stellar Demo Wallet is the backend to the demo wallet, currently it is used for:
1. Host the stellar.toml file
2. Sign requests to enable ([SEP-10]) client attribution.
3. Sign requests to enable ([SEP-45]) client attribution.
4. Sign for soroban transactions.

During the signing phase, the wallet client will make a request to the backend 
server to have the backend server sign the challenge that was issued by the anchor 
server. The wallet client will then sign the same request with the user's key before 
sending the challenge back to the anchor server for verification.

### Running the Demo Wallet Server

1. Create a keypair on the Stellar network (you can use the demo wallet for
   this). The keypair will be used for the Demo Wallet Server. To test with
   contract account, you’ll need an additional keypair to sign all related
   transactions.
2. Create a .env file in the package/demo-wallet-server directory.
   ```
   SERVER_PORT = 7000
   SERVER_SIGNING_KEY = <private key of keypair 1 generated in step 1>
   SOURCE_KEYPAIR_SECRET = <private key of keypair 2 generated in step 1>
   ```
3. Run the server
   ```
   yarn start:server
   ```

### Helpful links

- [https://www.stellar.org/developers](https://www.stellar.org/developers)
- [https://stellar.github.io/js-stellar-sdk/](https://stellar.github.io/js-stellar-sdk/)
- [https://github.com/stellar/js-stellar-sdk](https://github.com/stellar/js-stellar-sdk)

[sep-10]:
  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md
[sep-45]:
  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0045.md
