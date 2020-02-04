// // 1. Begin polling for the absence of `incomplete` status, this will be true until KYC and amount/desitination information is entered
// // 2. Once status is not `incomplete` set popup `callback` to `postMessage` and wait for a message status of `pending_user_transfer_start`
// // 3. Finally, if withdraw, submit the withdraw payment and then begin to poll for a status of `status`

// const urlBuilder = new URL(interactive.url)
//       urlBuilder.searchParams.set('jwt', auth)
// const popup = window.open(urlBuilder.toString(), 'popup', 'width=500,height=800')

// if (!popup) {
//   this.loading = {...this.loading, withdraw: false}
//   return alert('You\'ll need to enable popups for this demo to work')
// }

// let intervaled = 0
// const interval = setInterval(() => {
//   axios.get(`${this.toml.TRANSFER_SERVER}transaction`, {
//     params: {
//       id: transactions[0].id
//     },
//     headers: {
//       'Authorization': `Bearer ${auth}`
//     }
//   }).then(({data: {transaction}}) => {
//     intervaled++

//     console.log(transaction.status, transaction)

//     if (intervaled >= 60)

//     if (
//       intervaled >= 60
//       || transaction.status !== 'incomplete'
//     ) { // KYC has been passed, it's time to complete the withdraw
//       clearInterval(interval)

//       const urlBuilder = new URL(transaction.more_info_url)
//             urlBuilder.searchParams.set('jwt', auth)
//             urlBuilder.searchParams.set('callback', 'postMessage')
//       popup.location.replace(urlBuilder.toString())

//       window.addEventListener(
//         'message',
//         ({data: {transaction}}) => {
//           if (transaction.status === 'pending_user_transfer_start') {
//             this.server
//             .accounts()
//             .accountId(keypair.publicKey())
//             .call()
//             .then(({sequence}) => {
//               const account = new Account(keypair.publicKey(), sequence)
//               const txn = new TransactionBuilder(account, {
//                 fee: BASE_FEE,
//                 networkPassphrase: Networks.TESTNET
//               })
//               .addOperation(Operation.payment({
//                 destination: transaction.withdraw_anchor_account,
//                 asset: new Asset(currency[0], currency[1]),
//                 amount: transaction.amount_in
//               }))
//               .addMemo(new Memo(MemoHash, transaction.withdraw_memo))
//               .setTimeout(0)
//               .build()

//               txn.sign(keypair)
//               return this.server.submitTransaction(txn)
//             })
//             .then((res) => {
//               console.log(res)

//               let intervaled = 0

//               const interval = setInterval(() => {
//                 axios.get(`${this.toml.TRANSFER_SERVER}transaction`, {
//                   params: {
//                     id: transactions[0].id
//                   },
//                   headers: {
//                     'Authorization': `Bearer ${auth}`
//                   }
//                 }).then(({data: {transaction}}) => {
//                   intervaled++

//                   console.log(transaction.status, transaction)

//                   if (
//                     intervaled >= 60
//                     || transaction.status === 'completed'
//                   ) {
//                     this.updateAccount()
//                     this.loading = {...this.loading, withdraw: false}
//                     clearInterval(interval)

//                     const urlBuilder = new URL(transaction.more_info_url)
//                           urlBuilder.searchParams.set('jwt', auth)

//                     popup.location.replace(urlBuilder.toString())
//                   }
//                 })
//               }, 1000)
//             })
//           }
//         }
//       )
//     }
//   })
// }, 1000)