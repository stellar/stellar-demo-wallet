import { Transaction, Server } from 'stellar-sdk'
import axios from 'axios'
import {
  get as loGet,
  each as loEach,
  findIndex as loFindIndex,
} from 'lodash-es'
import TOML from 'toml'

import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { decrypt } from '@services/tweetnacl'
import { Wallet } from '../wallet'

export default async function depositAsset(
  this: Wallet,
  asset_code: string,
  asset_issuer: string
) {
  const loadingKey = `deposit:${asset_code}:${asset_issuer}`
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

    const balances = loGet(this.account, 'state.balances')
    const hasCurrency = loFindIndex(balances, {
      asset_code,
      asset_issuer,
    })

    if (hasCurrency === -1)
      await this.trustAsset(asset_code, asset_issuer, pincode_stretched)

    const server = this.server as Server
    const issuerAccount = await server.loadAccount(asset_issuer)
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

    this.logger.instruction(
      `Received WEB_AUTH_ENDPOINT from TOML: ${toml.WEB_AUTH_ENDPOINT}`
    )
    this.logger.instruction(
      `Received TRANSFER_SERVER from TOML: ${toml.TRANSFER_SERVER}`
    )
    this.logger.instruction(
      `Received asset issuer from TOML: ${toml.SIGNING_KEY}`
    )
    this.logger.instruction(
      'Check /info endpoint to see if we need to authenticate'
    )
    const infoURL = `${toml.TRANSFER_SERVER_SEP0024}/info`
    this.logger.request(infoURL)
    const info = await axios.get(infoURL).then(({ data }) => data)
    this.logger.response(infoURL, info)

    this.logger.instruction(
      'Deposit is enabled, and requires authentication so we should go through SEP-0010'
    )
    this.logger.instruction(
      'Start the SEP-0010 flow to authenticate the wallet’s Stellar account'
    )
    const params = { account: this.account.publicKey }
    this.logger.request(this.toml.WEB_AUTH_ENDPOINT, params)

    const auth = await axios
      .get(`${toml.WEB_AUTH_ENDPOINT}`, {
        params: {
          account: this.account.publicKey,
        },
      })
      .then(async ({ data }) => {
        this.logger.response(this.toml.WEB_AUTH_ENDPOINT, data)
        this.logger.instruction(
          'We’ve received a challenge transaction from the server that we need the client to sign with our Stellar account.'
        )
        const transaction: any = new Transaction(
          data.transaction,
          data.network_passphrase
        )
        this.logger.request('SEP-0010 Signed Transaction', transaction)

        this.error = null
        this.loading = { ...this.loading, deposit: true }

        const keypair = decrypt(
          this.account.cipher,
          this.account.nonce,
          pincode_stretched
        )

        transaction.sign(keypair)
        this.logger.response('Base64 Encoded', transaction.toXDR())
        this.logger.instruction(
          'We need to send the signed SEP10 challenge back to the server to get a JWT token to authenticate our stellar account with future actions'
        )
        const jwtParams = { account: this.account.publicKey }
        this.logger.request('POST /auth', jwtParams)
        return transaction.toXDR()
      })
      .then((transaction) =>
        axios.post(
          `${toml.WEB_AUTH_ENDPOINT}`,
          { transaction },
          { headers: { 'Content-Type': 'application/json' } }
        )
      )
      .then(({ data: { token } }) =>
        localStorage.setItem('token', JSON.stringify(token))
      )

    const tokenParams = { token: JSON.parse(localStorage.getItem('token')) }
    this.logger.request('POST /auth', tokenParams)

    const formData = new FormData()

    loEach(
      {
        asset_code,
        account: this.account.publicKey,
        lang: 'en',
      },
      (value, key) => formData.append(key, value)
    )

    this.logger.instruction(
      'To get the url for the interactive flow check the /transactions/deposit/interactive endpoint'
    )
    this.logger.request(
      toml.TRANSFER_SERVER_SEP0024 + '/transactions/deposit/interactive',
      'TODO: form data'
    )

    const interactive = await axios
      .post(
        `${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${auth}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      .then(({ data }) => data)

    this.logger.response(
      toml.TRANSFER_SERVER_SEP0024 + '/transactions/deposit/interactive',
      interactive
    )

    const transactions = await axios
      .get(`${toml.TRANSFER_SERVER_SEP0024}/transactions`, {
        params: {
          asset_code,
          limit: 1,
          kind: 'deposit',
        },
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      })
      .then(({ data: { transactions } }) => transactions)

    this.logger.response(
      `${toml.TRANSFER_SERVER_SEP0024}/transactions`,
      transactions
    )

    const urlBuilder = new URL(interactive.url)
    urlBuilder.searchParams.set('callback', 'postMessage')
    this.logger.instruction(
      'To collect the interactive information we launch the interactive URL in a frame or webview, and await payment details from a postMessage callback'
    )
    const popup = open(urlBuilder.toString(), 'popup', 'width=500,height=800')

    if (!popup) {
      this.loading = { ...this.loading, deposit: false }
      throw 'Popups are blocked. You’ll need to enable popups for this demo to work'
    }

    window.onmessage = ({ data: { transaction } }) => {
      if (transaction.status === 'completed') {
        this.updateAccount()
        this.logger.instruction('Transaction status complete')
        this.loading = { ...this.loading, deposit: false }
      } else {
        this.logger.instruction('Transaction status pending...')
        setTimeout(() => {
          const urlBuilder = new URL(transaction.more_info_url)
          urlBuilder.searchParams.set('callback', 'postMessage')

          popup.location.href = urlBuilder.toString()
        }, 1000)
      }
    }
  } catch (err) {
    this.loading = { ...this.loading, deposit: false }
    this.error = handleError(err)
    this.logger.error(err)
  }
}
