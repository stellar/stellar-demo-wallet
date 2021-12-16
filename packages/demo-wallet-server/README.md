# Stellar Demo Wallet Server

This Stellar Demo Wallet is the backend to the demo wallet, currently it is only used to host
the stellar.toml file and also sign requests to enable ([SEP-10]) client attribution. During
the signing phase of the SEP-10 flow, the wallet client will make a request to the backend server
to have the backend server sign the challenge that was issued by the anchor server. The wallet client 
will then sign the same request with the user's key before sending the challenge back to the anchor 
server for verification.


### Running the Demo Wallet Server
1. Create a keypair on the Stellar network (you can use the demo wallet for this).
   The keypair will be used for the Demo Wallet Server
2. Create a .env file in the package/demo-wallet-server directory. 
   ```
   SERVER_PORT = 7000
   SERVER_SIGNING_KEY = <private signing key generated in step 1>
   ```
3. Modify the *stellar.toml* file in *package/demo-wallet-server/src/static/well_known*
   Replace the **SIGNING_KEY** with the public key that was generated in step 1
4. Run the server
   ```
   yarn start:server
   ```

### Helpful links

- [https://www.stellar.org/developers](https://www.stellar.org/developers)
- [https://stellar.github.io/js-stellar-sdk/](https://stellar.github.io/js-stellar-sdk/)
- [https://github.com/stellar/js-stellar-sdk](https://github.com/stellar/js-stellar-sdk)

[sep-10]:
  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md


