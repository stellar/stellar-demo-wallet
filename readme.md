# Stellar Demo Wallet

This Stellar Demo Wallet app will soon be the defacto application to use when testing anchor services interactively. If you would live to automate testing of your anchor service, check out the SDF's [anchor validation suite](https://github.com/stellar/transfer-server-validator) viewable at [anchor-validator.stellar.org](anchor-validator.stellar.org).

This project was originally created for the [Build a Stellar Wallet](https://developers.stellar.org/docs/building-apps/) tutorial series. If you want to use parts or all of the project to kickstart your own wallet, feel free to clone or copy any pieces which may be helpful.

## Getting Started

To start building with this project clone this repo and install the deps:

```bash
npm i
```

and run:

```bash
npm start
```

To build the app for production, run:

```bash
npm run build
```

---

## Roadmap

- [x] Improve local development story
- [x] Add config-by-url support
- [x] Implement Claimable Balance support
- [ ] Add Pubnet Support
- [ ] Improve UX
- [ ] Forward sep24.stellar.org traffic to demo-wallet.stellar.org
- [ ] Implement SEP-31 support
- [ ] Implement SEP-6 support

### Helpful links:

- [https://www.stellar.org/developers](https://www.stellar.org/developers)
- [https://stellar.github.io/js-stellar-sdk/](https://stellar.github.io/js-stellar-sdk/)
- [https://github.com/stellar/js-stellar-sdk](https://github.com/stellar/js-stellar-sdk)
