# Stellar Demo Wallet

This Stellar Demo Wallet is our newly rebuilt application for interactively
testing anchor services. If you would like to automate testing of your anchor
service, check out the SDF's
[anchor tests suite](https://github.com/stellar/stellar-anchor-tests) viewable
at [https://anchor-tests.stellar.org/](https://anchor-tests.stellar.org/).

This project was originally created for the
[Build a Stellar Wallet](https://developers.stellar.org/docs/building-apps/)
tutorial series.
([That repo has since moved over here](https://github.com/stellar/docs-wallet)).

If you want to use parts or all of the project to kickstart your own wallet,
feel free to clone or copy any pieces that may be helpful.

## Getting A Test Account Up and Running

You can use the demo wallet to test Regulated Assets ([SEP-8]), Hosted Deposit
and Withdrawal ([SEP-24]) and Cross-Border Payments ([SEP-31]) with any home
domain that has a Stellar Info File (also known as [SEP-1], or a stellar.toml
file). The instructions below are for demo-ing standard integrations supported
by Stellar test server, testanchor.stellar.org or by the [SEP-8] reference
server, sep8-server.dev.stellar.org. For these integrations, the logs to the
right of the screen will show every network call.

### Demo-ing a Regulated Asset Payment ([SEP-8])

1. Click "Generate keypair", and then click "Create account" - this will create
   a balance of 10,000 XLM.
2. Click “Add asset” and add `MYASSET` with the anchor home domain
   `sep8-server.dev.stellar.org`.
3. Click “Add trustline” - this will allow you to hold MYASSET.
4. Click on the "Copy" link on the right of your public key and use that value
   to get some unities of MYASSET using the link
   `https://sep8-server.dev.stellar.org/friendbot?addr=<paste_your_address_here>`.
   Refresh the [demo-wallet page](https://demo-wallet.stellar.org/) to see funds
   in your account.
5. Select "SEP-8 Send" from the dropdown of MYASSET and click "Start" in the
   modal.
6. In the "destination" field, input an address that also has a trustline to
   MYASSET.
7. The modal will display the approval criteria used by the SEP-8 server.
   Depending on the conditions described there your payment can be automatically
   approved or you may be required to undergo an additional KYC step.
8. After your payment gets revised and signed by the SEP-8 reference server
   you'll need to review the updated transaction before the demo wallet submits
   the payment.
9. If the payment has been successfully sent you'll see "SEP-8 send payment
   completed 🎉" in the logs.

### Demo-ing a Deposit on Testnet with Hosted Deposit and Withdrawal ([SEP-24])

1. Click "Generate keypair", and then click "Create account" - this will create
   a balance of 10,000 XLM.
2. Click “Add asset” and add `SRT` (this stands for Stellar Reference Token,
   it’s our representation of XLM for the test server) with the anchor home
   domain `testanchor.stellar.org`.
3. Click “Add trustline” - this will allow you to hold SRT.
4. Select “SEP-24 deposit” from the dropdown for your SRT asset and click
   "Start" in the modal.
5. If your browser doesn't already, make sure it allows pop-ups - this is how
   the demo wallet requests KYC info.
6. Enter your name and email in the pop-up - this information doesn't need to be
   real, but the interface will want a valid email.
7. Click “Skip confirmation” - skipping it won't be possible in live
   integrations but helps the process move ahead in the demo.
8. Select the asset you would like to provide to the anchor. Note that there
   is no real asset you actually need to provide off-chain, it's just for 
   demonstration.
9. Enter a number into the amount and click "Submit".
10. If you opted to provide "USD" in the previous form, you'll be asked to confirm
   the exchange rate from USD to SRT. Select "Confirm Transaction" to continue.
11. Leave the pop-up window open while you wait to see the deposit of SRT made
   to your account - you can close when you see “Status” is complete and you have 
   SRT.

### Demo-ing Cross-Border Payments ([SEP-31]) on Testnet

_Note: specifically in the case of demo-ing SEP-31 in the Demo Wallet, notice
the public and secret keys don't represent the Sending Client but instead the
Sending Anchor's account. In SEP-31, the only Stellar transaction happening is
between the Sending and the Receiving anchors._

1. Follow the steps above in order to establish an amount of SRT to send.
2. Select “SEP-31 Send” from the dropdown for your SRT asset and click "Start"
   in the modal.
3. Enter the requested information in the pop-up - none of the info has to be
   real for this testanchor.stellar.org demo, this is only to show the fields
   required. When testing another anchor you may need to adhere to their
   validation requirements.
4. If the payment has been successfully sent you'll see "SEP-31 send payment
   completed" in the logs.

### Using stellar.toml file from `localhost`

You can serve asset `toml` files from `locahost`. When using locally hosted
stellar.toml files on demo-wallet.stellar.org, some browsers might block them
for security reasons, if you’re not using `https`. If you’re running demo wallet
locally, this is not a problem.

## Getting Started Building A Wallet From This Demo

To start building with this project clone this repo and install the deps:

```bash
yarn install
```

create a **.env** file in *packages/demo-wallet-client* with the **REACT_APP_CLIENT_DOMAIN** 
(where stellar.toml is hosted) and the wallet backend **REACT_APP_WALLET_BACKEND_ENDPOINT**

NOTE: if using a locally running test anchor (in docker) use *docker.for.mac.host.internal*,
this will allow the anchor thats running in a docker container to access the host network where
the client domain (server hosting the stellar.toml) is running.
ex:
```
REACT_APP_CLIENT_DOMAIN = docker.for.mac.host.internal:7000
REACT_APP_WALLET_BACKEND_ENDPOINT = http://demo-wallet-server.stellar.org
```

and run:

```bash
yarn start:client
```

To build the app for production, run:

```bash
yarn build:client
```

---

## Release Notes

### v1.2

- SEP-06 now supported
- SEP-08 now supported
- Fixed a [bug](https://github.com/stellar/stellar-demo-wallet/issues/188) when
  overriding home domain
- Fixed an [issue](https://github.com/stellar/stellar-demo-wallet/issues/196)
  where balance amounts were being overwritten
- Sending to Muxed Accounts is now supported

### [v1.1](https://github.com/stellar/stellar-demo-wallet/releases/tag/v1.1.0)

- Fix for local CORS issue
- Updated Sentry to log exceptions

### v1.0

- Revamped UI
- All SEPs are integrated into one tool
  - SEP-24 and SEP-31 are now found in the Asset action drop-down menus
- Ablity to download logs
- Claimable Balances supported

### Helpful links

- [https://www.stellar.org/developers](https://www.stellar.org/developers)
- [https://stellar.github.io/js-stellar-sdk/](https://stellar.github.io/js-stellar-sdk/)
- [https://github.com/stellar/js-stellar-sdk](https://github.com/stellar/js-stellar-sdk)

[sep-1]:
  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md
[sep-8]:
  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0008.md
[sep-24]:
  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md
[sep-31]:
  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md
