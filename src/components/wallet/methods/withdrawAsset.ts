import {
  Transaction,
  Account,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
  MemoHash,
  Keypair,
} from 'stellar-sdk'
import { StellarTomlResolver } from 'stellar-sdk'

import axios from 'axios'
import {
  get as loGet,
  each as loEach,
  findIndex as loFindIndex,
} from 'lodash-es'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'
import { PromptInput } from '@prompt/promptInput'

export default async function withdrawAsset(
  this: Wallet,
  assetCode: string,
  assetIssuer: string
) {
  const loadingKey = `withdraw:${assetCode}:${assetIssuer}`
  this.loading = { ...this.loading, [loadingKey]: true }
  const finish = () => (this.loading = { ...this.loading, [loadingKey]: false })

  try {
    const keypair = Keypair.fromSecret(this.account.secretKey)

    // I don't understand this. Why are we making requests for /account JSON elsewhere
    // when it seems to be stored in 'state'? Where is this populated?
    const balances = loGet(this.account, 'state.balances')
    const hasCurrency = loFindIndex(balances, {
      asset_code: assetCode,
      asset_issuer: assetIssuer,
    })

    if (hasCurrency === -1)
      //@ts-ignore
      await this.trustAsset(assetCode, assetIssuer)

    let homeDomain = this.assets.get(`${assetCode}:${assetIssuer}`).homeDomain
    if (!homeDomain) {
      const issuerAccount = await this.server.loadAccount(assetIssuer)
      homeDomain = issuerAccount.home_domain
    }
    if (!homeDomain) {
      let inputs
      try {
        inputs = await this.setPrompt({
          message: "Enter the anchor's home domain",
          inputs: [new PromptInput('anchor home domain (ex. example.com)')],
        })
      } catch {
        finish()
        return
      }
      homeDomain = inputs[0].value
    }
    homeDomain = homeDomain.includes('https://')
      ? homeDomain
      : 'https://' + homeDomain
    const tomlURL = new URL(homeDomain)
    tomlURL.pathname = '/.well-known/stellar.toml'
    this.logger.request(tomlURL.toString())
    let toml = await StellarTomlResolver.resolve(tomlURL.host)
    this.logger.response(tomlURL.toString(), toml)

    this.assets.set(`${assetCode}:${assetIssuer}`, { homeDomain, toml })

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

    const urlBuilder = new URL(interactive.url)
    urlBuilder.searchParams.set('callback', 'postMessage')
    const popup = open(urlBuilder.toString(), 'popup', 'width=500,height=800')

    if (!popup) {
      finish()
      throw "Popups are blocked. You'll need to enable popups for this demo to work"
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
                networkPassphrase: this.network_passphrase,
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
