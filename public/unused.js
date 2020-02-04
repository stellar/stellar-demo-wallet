// import { Prop } from '@stencil/core'
// import 'regenerator-runtime/runtime'
// import axios from 'axios'
// import { Keypair, Networks, Server, Account, TransactionBuilder, BASE_FEE, Operation, Asset } from 'stellar-sdk'
// import { KeyManager, KeyManagerPlugins, KeyType } from '@stellar/wallet-sdk'

// @Prop({mutable: true}) keyManager: KeyManager

//  async componentWillLoad() {
//   this.keyManager = new KeyManager({keyStore: new KeyManagerPlugins.MemoryKeyStore()});
//   this.keyManager.registerEncrypter(KeyManagerPlugins.ScryptEncrypter);
//   this.keyManager.setDefaultNetworkPassphrase(Networks.TESTNET);
// }

// this.keyManager
// .storeKey({
//   key: {
//     publicKey: keypair.publicKey(),
//     privateKey: keypair.secret(),
//     type: KeyType.plaintextKey,
//     network: Networks.TESTNET
//   },
//   password: pincode,
//   encrypterName: KeyManagerPlugins.ScryptEncrypter.name,
// })
// .then(async (keyMetadata) => {
//   await axios(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)

//   const server = new Server('https://horizon-testnet.stellar.org')

//   server.accounts()
//   .accountId(keypair.publicKey())
//   .call()
//   .then(({sequence}) => {
//     const account = new Account(keypair.publicKey(), sequence)
//     const transaction = new TransactionBuilder(account, {
//       fee: BASE_FEE,
//       networkPassphrase: Networks.TESTNET
//     })
//     .addOperation(Operation.payment({
//       destination: keypair.publicKey(),
//       asset: Asset.native(),
//       amount: '100'
//     }))
//     .setTimeout(0)
//     .build()

//     this.keyManager.signTransaction({
//       transaction,
//       id: keyMetadata.id,
//       password: pincode,
//     })
//     .then((transaction) => server.submitTransaction(transaction))
//     .then((res) => console.log(res))
//     .catch((err) => console.error(err))
//   })
// })
// .catch((e) => {
//   console.error(e);
// });