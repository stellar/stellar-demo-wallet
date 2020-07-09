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

export default async function depositAsset(
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

    const infoURL = `${toml.TRANSFER_SERVER_SEP0024}/info`
    this.logger.request(infoURL)
    const info = await axios.get(infoURL).then(({ data }) => data)
    this.logger.response(infoURL, info)
    console.log(info)

    const auth = await axios
      .get(`${toml.WEB_AUTH_ENDPOINT}`, {
        params: {
          account: this.account.publicKey,
        },
      })
      .then(async ({ data }) => {
        const transaction: any = new Transaction(
          data.transaction,
          data.network_passphrase
        )

        this.error = null
        this.loading = { ...this.loading, deposit: true }

        const keypair = decrypt(
          this.account.cipher,
          this.account.nonce,
          pincode_stretched
        )

        transaction.sign(keypair)
        return transaction.toXDR()
      })
      .then((transaction) =>
        axios.post(
          `${toml.WEB_AUTH_ENDPOINT}`,
          { transaction },
          { headers: { 'Content-Type': 'application/json' } }
        )
      )
      .then(({ data: { token } }) => token) // TODO: Store the JWT in localStorage

    console.log(auth)

    const formData = new FormData()

    loEach(
      {
        asset_code,
        account: this.account.publicKey,
        lang: 'en',
      },
      (value, key) => formData.append(key, value)
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

    console.log(interactive)

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

    console.log(transactions)

    const urlBuilder = new URL(interactive.url)
    urlBuilder.searchParams.set('callback', 'postMessage')
    const popup = open(urlBuilder.toString(), 'popup', 'width=500,height=800')

    if (!popup) {
      this.loading = { ...this.loading, deposit: false }
      throw 'Popups are blocked. You\'ll need to enable popups for this demo to work'
    }

    window.onmessage = ({ data: { transaction } }) => {
      console.log(transaction.status, transaction)

      if (transaction.status === 'completed') {
        this.updateAccount()
        this.loading = { ...this.loading, deposit: false }
      } else {
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
  }
}
