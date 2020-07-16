import {
  Transaction,
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
  Memo,
  MemoHash,
  Server,
} from 'stellar-sdk'
import TOML from 'toml'

import axios from 'axios'
import {
  get as loGet,
  each as loEach,
  findIndex as loFindIndex,
} from 'lodash-es'

import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { decrypt } from '@services/tweetnacl'
import { Wallet } from '../wallet'

export default async function withdrawAsset(
  this: Wallet,
  assetCode: string,
  assetIssuer: string
) {
  const loadingKey = `withdraw:${assetCode}:${assetIssuer}`
  this.loading = { ...this.loading, [loadingKey]: true }
  const finish = () => (this.loading = { ...this.loading, [loadingKey]: false })

  try {
    const pincode = await this.setPrompt({
      message: 'Enter your account pincode',
      type: 'password',
    })
    const pincode_stretched = await stretchPincode(
      pincode,
      this.account.publicKey
    )

    const keypair = decrypt(
      this.account.cipher,
      this.account.nonce,
      pincode_stretched
    )

    const server = this.server as Server
    const issuerAccount = await server.loadAccount(assetIssuer)
    const homeDomain: string = (issuerAccount as any).home_domain
    if (!homeDomain) {
      this.logger.error("Couldn't find a home_domain on the assets issuer")
      finish()
      return
    }
    this.logger.instruction(
      `Found home_domain '${homeDomain}' as issuer's domain, fetching the TOML file to find the approval server`
    )
    const tomlURL = new URL(homeDomain)
    tomlURL.pathname = '/.well-known/stellar.toml'
    this.logger.request(tomlURL.toString())
    const tomlText = await fetch(tomlURL.toString()).then((r) => r.text())
    this.logger.response(tomlURL.toString(), tomlText)
    const toml = TOML.parse(tomlText)

    const info = await axios
      .get(`${toml.TRANSFER_SERVER_SEP0024}/info`)
      .then(({ data }) => data)

    console.log(info)

    const auth = await axios
      .get(`${toml.WEB_AUTH_ENDPOINT}`, {
        params: {
          account: this.account.publicKey,
        },
      })
      .then(async ({ data: { transaction, network_passphrase } }) => {
        const txn: any = new Transaction(transaction, network_passphrase)

        this.error = null

        txn.sign(keypair)
        return txn.toXDR()
      })
      .then((transaction) =>
        axios.post(
          `${toml.WEB_AUTH_ENDPOINT}`,
          { transaction },
          { headers: { 'Content-Type': 'application/json' } }
        )
      )
      .then(({ data: { token } }) => token) // Store the JWT in localStorage

    console.log(auth)

    const formData = new FormData()

    loEach(
      {
        asset_code: assetCode,
        account: this.account.publicKey,
        lang: 'en',
      },
      (value, key) => formData.append(key, value)
    )

    const interactive = await axios
      .post(
        `${toml.TRANSFER_SERVER_SEP0024}/transactions/withdraw/interactive`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${auth}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      .then(({ data }) => data)

    console.log(interactive)

    const transactions = await axios
      .get(`${toml.TRANSFER_SERVER_SEP0024}/transactions`, {
        params: {
          asset_code: assetCode,
          limit: 1,
          kind: 'withdrawal',
        },
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      })
      .then(({ data: { transactions } }) => transactions)

    console.log(transactions)

    const urlBuilder = new URL(interactive.url)
    urlBuilder.searchParams.set('callback', 'postMessage')
    const popup = open(urlBuilder.toString(), 'popup', 'width=500,height=800')

    if (!popup) {
      finish()
      throw 'Popups are blocked. You\'ll need to enable popups for this demo to work'
    }

    await new Promise((resolve, reject) => {
      let submittedTxn

      window.onmessage = ({ data: { transaction } }) => {
        console.log(transaction.status, transaction)

        if (transaction.status === 'completed') {
          this.updateAccount()
          finish()
          resolve()
        } else if (
          !submittedTxn &&
          transaction.status === 'pending_user_transfer_start'
        ) {
          this.server
            .accounts()
            .accountId(keypair.publicKey())
            .call()
            .then(({ sequence }) => {
              const account = new Account(keypair.publicKey(), sequence)
              const txn = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET,
              })
                .addOperation(
                  Operation.payment({
                    destination: transaction.withdraw_anchor_account,
                    asset: new Asset(assetCode, assetIssuer),
                    amount: transaction.amount_in,
                  })
                )
                .addMemo(
                  new Memo(
                    MemoHash,
                    atob(transaction.withdraw_memo)
                      .split('')
                      .map((aChar) =>
                        `0${aChar.charCodeAt(0).toString(16)}`.slice(-2)
                      )
                      .join('')
                      .toUpperCase()
                  )
                )
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
        } else {
          setTimeout(() => {
            const urlBuilder = new URL(transaction.more_info_url)
            urlBuilder.searchParams.set('callback', 'postMessage')

            popup.location.href = urlBuilder.toString()
          }, 1000)
        }
      }
    })
  } catch (err) {
    finish()
    this.error = handleError(err)
  }
}
