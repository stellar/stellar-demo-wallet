import { Transaction, Keypair } from 'stellar-sdk'
import TOML from 'toml'
import { get } from 'lodash-es'

import { handleError } from '@services/error'
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
    this.logger.request('Fetch issuer account from Horizon', asset_issuer)
    const issuerAccount = await this.server.loadAccount(asset_issuer)
    this.logger.response('Fetch issuer account from Horizon', issuerAccount)
    const homeDomain = issuerAccount.home_domain
    if (!homeDomain) throw "Couldn't find a home_domain on the assets issuer"

    this.logger.instruction(
      `Found home_domain '${homeDomain}' as issuer's domain, fetching the TOML file to find the transfer server`
    )
    const tomlURL = new URL(
      homeDomain.includes('https://') ? homeDomain : 'https://' + homeDomain
    )
    tomlURL.pathname = '/.well-known/stellar.toml'
    this.logger.request(tomlURL.toString())
    const tomlText = await fetch(tomlURL.toString()).then((r) => r.text())
    this.logger.response(tomlURL.toString(), tomlText)
    const toml = TOML.parse(tomlText)

    this.logger.instruction(
      `Received WEB_AUTH_ENDPOINT from TOML: ${toml.WEB_AUTH_ENDPOINT}`
    )
    this.logger.instruction(
      `Received TRANSFER_SERVER_SEP0024 from TOML: ${toml.TRANSFER_SERVER_SEP0024}`
    )
    this.logger.instruction(
      `Received asset issuer from TOML: ${toml.SIGNING_KEY}`
    )
    if (
      !toml.SIGNING_KEY ||
      !toml.TRANSFER_SERVER_SEP0024 ||
      !toml.WEB_AUTH_ENDPOINT
    ) {
      throw 'TOML must contain a SIGNING_KEY, TRANSFER_SERVER_SEP0024 and WEB_AUTH_ENDPOINT'
    }

    this.logger.instruction(
      'Check /info endpoint to ensure this currency is enabled for deposit'
    )
    const infoURL = `${toml.TRANSFER_SERVER_SEP0024}/info`
    this.logger.request(infoURL)
    const info = await fetch(infoURL).then((r) => r.json())
    this.logger.response(infoURL, info)
    if (!get(info, ['deposit', asset_code, 'enabled']))
      throw 'Asset is not enabled in the /info endpoint'
    this.logger.instruction(
      'Deposit is enabled, and requires authentication so we should go through SEP-0010'
    )

    this.logger.instruction(
      'Start the SEP-0010 flow to authenticate the wallet’s Stellar account'
    )
    const authParams = { account: this.account.publicKey }
    this.logger.request(this.toml.WEB_AUTH_ENDPOINT, authParams)
    const getChallengeURL = new URL(toml.WEB_AUTH_ENDPOINT)
    getChallengeURL.searchParams.set('account', this.account.publicKey)
    const challengeResponse = await fetch(
      getChallengeURL.toString()
    ).then((r) => r.json())
    this.logger.response(this.toml.WEB_AUTH_ENDPOINT, challengeResponse)
    if (!challengeResponse.transaction)
      throw "The WEB_AUTH_ENDPOINT didn't return a challenge transaction"
    this.logger.instruction(
      'We’ve received a challenge transaction from the server that we need the client to sign with our Stellar account.'
    )
    const transaction: any = new Transaction(
      challengeResponse.transaction,
      challengeResponse.network_passphrase
    )
    this.logger.request('SEP-0010 Signed Transaction', transaction)

    const keypair = Keypair.fromSecret(this.account.secretKey)

    transaction.sign(keypair)
    this.logger.response('Base64 Encoded', transaction.toXDR())
    this.logger.instruction(
      'We need to send the signed SEP10 challenge back to the server to get a JWT token to authenticate our stellar account with future actions'
    )
    const jwtParams = { account: this.account.publicKey }
    this.logger.request('POST /auth', jwtParams)
    const signedChallenge = transaction.toXDR()
    const tokenResponse = await fetch(`${toml.WEB_AUTH_ENDPOINT}`, {
      method: 'POST',
      body: JSON.stringify({ transaction: signedChallenge }),
      headers: { 'Content-Type': 'application/json' },
    }).then((r) => r.json())
    this.logger.response('POST /auth', tokenResponse)
    if (!tokenResponse.token) throw 'No token was returned from POST /auth'
    const auth = tokenResponse.token

    const formData = new FormData()
    const postDepositParams = {
      asset_code,
      account: this.account.publicKey,
      lang: 'en',
      claimable_balance_supported: true,
    }
    Object.keys(postDepositParams).forEach((key) => {
      formData.append(key, postDepositParams[key])
    })

    this.logger.instruction(
      'To get the url for the interactive flow check the /transactions/deposit/interactive endpoint'
    )

    this.logger.request(
      `POST ${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`,
      postDepositParams
    )
    const interactiveResponse = await fetch(
      `${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`,
      {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      }
    ).then((r) => r.json())
    this.logger.response(
      toml.TRANSFER_SERVER_SEP0024 + '/transactions/deposit/interactive',
      interactiveResponse
    )
    if (!interactiveResponse.url) {
      throw 'No URL Returned from POST /transactions/deposit/interactive'
    }

    const urlBuilder = new URL(interactiveResponse.url)
    urlBuilder.searchParams.set('callback', 'postMessage')
    this.logger.instruction(
      'To collect the interactive information we launch the interactive URL in a frame or webview, and await payment details from a postMessage callback'
    )
    const popup = open(urlBuilder.toString(), 'popup', 'width=500,height=800')

    if (!popup) {
      throw 'Popups are blocked. You’ll need to enable popups for this demo to work'
    }

    window.onmessage = ({ data: { transaction } }) => {
      if (transaction.status === 'completed') {
        this.updateAccount()
        this.logger.instruction('Transaction status complete')
        finish()
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
    finish()
    this.error = handleError(err)
    this.logger.error(err)
  }
}
