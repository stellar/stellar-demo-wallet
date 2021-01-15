import { Transaction, Keypair, StellarTomlResolver } from 'stellar-sdk'
import { get } from 'lodash-es'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'
import { PromptInput } from '@prompt/promptInput'

export default async function depositAsset(
  this: Wallet,
  asset_code: string,
  asset_issuer: string
) {
  const loadingKey = `deposit:${asset_code}:${asset_issuer}`
  this.loading = { ...this.loading, [loadingKey]: true }
  const finish = () => (this.loading = { ...this.loading, [loadingKey]: false })

  try {
    let homeDomain = null
    if (this.assets.get(`${asset_code}:${asset_issuer}`)) {
      homeDomain = this.assets.get(`${asset_code}:${asset_issuer}`).homeDomain
    }
    if (!homeDomain) {
      this.logger.request('Fetching issuer account from Horizon', asset_issuer)
      let accountRecord = await this.server
        .accounts()
        .accountId(asset_issuer)
        .call()
      this.logger.response(
        'Fetching issuer account from Horizon',
        accountRecord
      )
      homeDomain = accountRecord.home_domain
    }
    if (!homeDomain) {
      let inputs
      try {
        inputs = await this.setPrompt({
          message: "Enter the anchor's home domain",
          inputs: [new PromptInput('anchor home domain (ex. example.com)')],
        })
      } catch (e) {
        finish()
        return
      }
      homeDomain = inputs[0].value
    }
    homeDomain = homeDomain.startsWith('http')
      ? homeDomain
      : 'https://' + homeDomain
    const tomlURL = new URL(homeDomain)
    tomlURL.pathname = '/.well-known/stellar.toml'
    this.logger.request(tomlURL.toString())
    const toml =
      tomlURL.protocol == 'http:'
        ? await StellarTomlResolver.resolve(tomlURL.host, { allowHttp: true })
        : await StellarTomlResolver.resolve(tomlURL.host)

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

    // Set asset here because we have the homeDomain and toml contents
    this.assets.set(`${asset_code}:${asset_issuer}`, { homeDomain, toml })

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
    this.logger.request(toml.WEB_AUTH_ENDPOINT, authParams)
    const getChallengeURL = new URL(toml.WEB_AUTH_ENDPOINT)
    getChallengeURL.searchParams.set('account', this.account.publicKey)
    const challengeResponse = await fetch(
      getChallengeURL.toString()
    ).then((r) => r.json())
    this.logger.response(toml.WEB_AUTH_ENDPOINT, challengeResponse)
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

    this.logger.request(
      `POST ${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`,
      postDepositParams
    )
    let response = await fetch(
      `${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`,
      {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      }
    )
    const interactiveJson = await response.json()
    this.logger.response(
      toml.TRANSFER_SERVER_SEP0024 + '/transactions/deposit/interactive',
      interactiveJson
    )
    if (!interactiveJson.url) {
      throw 'No URL Returned from POST /transactions/deposit/interactive'
    }
    const popupUrl = new URL(interactiveJson.url)
    const popup = open(popupUrl.toString(), 'popup', 'width=500,height=800')
    if (!popup) {
      throw 'Popups are blocked. You’ll need to enable popups for this demo to work'
    }

    let currentStatus = 'incomplete'
    const transactionUrl = new URL(
      `${toml.TRANSFER_SERVER_SEP0024}/transaction?id=${interactiveJson.id}`
    )
    this.logger.instruction(`Polling for updates: ${transactionUrl.toString()}`)
    while (!popup.closed && !['completed', 'error'].includes(currentStatus)) {
      response = await fetch(transactionUrl.toString(), {
        headers: { Authorization: `Bearer ${auth}` },
      })
      let transactionJson = await response.json()
      if (transactionJson.transaction.status !== currentStatus) {
        currentStatus = transactionJson.transaction.status
        popup.location.href = transactionJson.transaction.more_info_url
        this.logger.instruction(
          `Transaction ${interactiveJson.id} is in ${transactionJson.transaction.status} status`
        )
        switch (currentStatus) {
          case 'pending_user_transfer_start': {
            this.logger.instruction(
              'The anchor is waiting on you to take the action described in the popup'
            )
            break
          }
          case 'pending_anchor': {
            this.logger.instruction('The anchor is processing the transaction')
            break
          }
          case 'pending_stellar': {
            this.logger.instruction(
              'The Stellar network is processing the transaction'
            )
            break
          }
          case 'pending_external': {
            this.logger.instruction(
              'The transaction is being processed by an external system'
            )
            break
          }
          case 'pending_trust': {
            this.logger.instruction(
              'You must add a trustline to the asset in order to receive your deposit'
            )
            this.logger.instruction('Adding trustline...')
            await this.trustAsset(asset_code, asset_issuer)
            break
          }
          case 'pending_user': {
            this.logger.instruction(
              'The anchor is waiting for you to take the action described in the popup'
            )
            break
          }
          case 'error': {
            this.logger.instruction(
              'There was a problem processing your transaction'
            )
            break
          }
        }
      }
      // run loop every 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    this.logger.instruction(`Transaction status: ${currentStatus}`)
    if (!['completed', 'error'].includes(currentStatus) && popup.closed) {
      this.logger.instruction(
        'The popup was closed before the transaction reached a terminal status, ' +
          'if your balance is not updated soon, the transaction may have failed.'
      )
    }
    this.updateAccount()
    finish()
  } catch (err) {
    finish()
    this.error = handleError(err)
    this.logger.error(err)
  }
}
