import {
  Transaction,
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
  Memo,
  MemoHash
} from 'stellar-sdk'

import axios from 'axios'
import {
  get as loGet,
  each as loEach,
  findIndex as loFindIndex,
} from 'lodash-es'

import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { decrypt } from '@services/tweetnacl'

export default async function withdrawAsset() {
  try {
    let currency = await this.setPrompt({
      message: 'Select the currency you\'d like to withdraw',
      options: this.toml.CURRENCIES
    }); currency = currency.split(':')

    const pincode = await this.setPrompt({
      message: 'Enter your account pincode',
      type: 'password'
    })
    const pincode_stretched = await stretchPincode(pincode, this.account.publicKey)

    const keypair = decrypt(
      this.account.cipher,
      this.account.nonce,
      pincode_stretched
    )

    const balances = loGet(this.account, 'state.balances')
    const hasCurrency = loFindIndex(balances, {
      asset_code: currency[0],
      asset_issuer: currency[1]
    })

    if (hasCurrency === -1)
      await this.trustAsset(currency[0], currency[1], pincode)

    const info = await axios.get(`${this.toml.TRANSFER_SERVER}/info`)
    .then(({data}) => data)

    console.log(info)

    const auth = await axios.get(`${this.toml.WEB_AUTH_ENDPOINT}`, {
      params: {
        account: this.account.publicKey
      }
    })
    .then(async ({data: {transaction, network_passphrase}}) => {
      const txn: any = new Transaction(transaction, network_passphrase)

      this.error = null
      this.loading = {...this.loading, withdraw: true}

      txn.sign(keypair)
      return txn.toXDR()
    })
    .then((transaction) => axios.post(`${this.toml.WEB_AUTH_ENDPOINT}`, {transaction}, {headers: {'Content-Type': 'application/json'}}))
    .then(({data: {token}}) => token) // Store the JWT in localStorage

    console.log(auth)

    const formData = new FormData()

    loEach({
      asset_code: currency[0],
      account: this.account.publicKey,
      lang: 'en'
    }, (value, key) => formData.append(key, value))

    const interactive = await axios.post(`${this.toml.TRANSFER_SERVER}/transactions/withdraw/interactive`, formData, {
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'multipart/form-data'
      }
    }).then(({data}) => data)

    console.log(interactive)

    const transactions = await axios.get(`${this.toml.TRANSFER_SERVER}/transactions`, {
      params: {
        asset_code: currency[0],
        limit: 1,
        kind: 'withdrawal',
      },
      headers: {
        'Authorization': `Bearer ${auth}`
      }
    })
    .then(({data: {transactions}}) => transactions)

    console.log(transactions)

    const urlBuilder = new URL(interactive.url)
          urlBuilder.searchParams.set('callback', 'postMessage')
    const popup = open(urlBuilder.toString(), 'popup', 'width=500,height=800')

    if (!popup) {
      this.loading = {...this.loading, withdraw: false}
      throw 'Popups are blocked. You\'ll need to enable popups for this demo to work'
    }

    await new Promise((resolve, reject) => {
      let submittedTxn

      window.onmessage = ({data: {transaction}}) => {
        console.log(transaction.status, transaction)

        if (transaction.status === 'completed') {
          this.updateAccount()
          this.loading = {...this.loading, withdraw: false}
          resolve()
        }

        else if (
          !submittedTxn
          && transaction.status === 'pending_user_transfer_start'
        ) {
          this.server
          .accounts()
          .accountId(keypair.publicKey())
          .call()
          .then(({sequence}) => {
            const account = new Account(keypair.publicKey(), sequence)
            const txn = new TransactionBuilder(account, {
              fee: BASE_FEE,
              networkPassphrase: Networks.TESTNET
            })
            .addOperation(Operation.payment({
              destination: transaction.withdraw_anchor_account,
              asset: new Asset(currency[0], currency[1]),
              amount: transaction.amount_in
            }))
            .addMemo(new Memo(MemoHash, transaction.withdraw_memo))
            .setTimeout(0)
            .build()

            txn.sign(keypair)
            return this.server.submitTransaction(txn)
          })
          .then((res) => {
            console.log(res)
            submittedTxn = res

            const urlBuilder = new URL(transaction.more_info_url)
                  urlBuilder.searchParams.set('callback', 'postMessage')

            popup.location.href = urlBuilder.toString()
          })
          .catch((err) => reject(err))
        }

        else {
          setTimeout(() => {
            const urlBuilder = new URL(transaction.more_info_url)
                  urlBuilder.searchParams.set('callback', 'postMessage')

            popup.location.href = urlBuilder.toString()
          }, 1000)
        }
      }
    })
  }

  catch (err) {
    this.loading = {...this.loading, withdraw: false}
    this.error = handleError(err)
  }
}