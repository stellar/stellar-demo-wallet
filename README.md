# Stellar Demo Wallet

This Stellar Demo Wallet is our newly rebuilt application for
interactively testing anchor services. If you would like to automate testing of
your anchor service, check out the SDF's
[anchor validation suite](https://github.com/stellar/transfer-server-validator)
viewable at [anchor-validator.stellar.org](anchor-validator.stellar.org).

This project was originally created for the
[Build a Stellar Wallet](https://developers.stellar.org/docs/building-apps/)
tutorial series.
([That repo has since moved over here](https://github.com/stellar/docs-wallet)).

If you want to use parts or all of the project to kickstart your own wallet,
feel free to clone or copy any pieces that may be helpful.

## Getting A Test Account Up and Running

You can use the demo wallet to test Hosted Deposit and Withdrawal (SEP-24) and Cross-Border Payments (SEP-31) with any home domain that has a Stellar Info File (also known as SEP-1, or a stellar.toml file). The instructions below are for demo-ing standard integrations supported by Stellar test server, testanchor.stellar.org. For both integrations, the logs to the right of the screen will show every network call. 

### Demo-ing a Deposit on Testnet with Hosted Deposit and Withdrawal (SEP-24)
1. Click "Generate keypair", and then click "Create account" - this will create a balance of 10,000 XLM.
2. Click “Add asset” and add `SRT` (this stands for Stellar Reference Token, it’s our representation of XLM for the test server) with the anchor home domain `testanchor.stellar.org`.
3. Click “Add trustline” - this will allow you to hold SRT.
4. Select “SEP-24 deposit” from the dropdown for your SRT asset and click "Start" in the modal.
5. If your browser doesn't already, make sure it allows pop-ups - this is how the demo wallet requests KYC info. 
6. Enter your name and email in the pop-up - this information doesn't need to be real, but the interface will want a valid email.
7. Click “Skip confirmation” - skipping it won't be possible in live integrations but helps the process move ahead in the demo.
8. Enter a number into the amount and click "Submit". 
9. Leave the pop-up window open while you wait to see the deposit of SRT go through - you can close when you see “Status” is complete and you have SRT.

### Demo-ing Cross-Border Payments (SEP-31) on Testnet
1. Follow the steps above in order to establish an amount of SRT to send.
2. Select “SEP-31 Send” from the dropdown for your SRT asset and click "Start" in the modal.
3. Enter the requested information in the pop-up - none of the info has to be real for this testanchor.stellar.org demo, this is only to show the fields required. When testing another anchor you may need to adhere to their validation requirements.
4. If the payment has been successfully sent you'll see "SEP-31 send payment completed" in the logs.

## Getting Started Building A Wallet From This Demo

To start building with this project clone this repo and install the deps:

```bash
yarn install
```

and run:

```bash
yarn start
```

To build the app for production, run:

```bash
yarn build
```

---

## Roadmap

- [x] Improve local development story
- [x] Add config-by-url support
- [x] Implement Claimable Balance support
- [x] Add Pubnet Support
- [x] Improve UX
- [ ] Forward sep24.stellar.org traffic to demo-wallet.stellar.org
- [x] Implement SEP-31 support
- [ ] Implement SEP-6 support

### Helpful links

- [https://www.stellar.org/developers](https://www.stellar.org/developers)
- [https://stellar.github.io/js-stellar-sdk/](https://stellar.github.io/js-stellar-sdk/)
- [https://github.com/stellar/js-stellar-sdk](https://github.com/stellar/js-stellar-sdk)
