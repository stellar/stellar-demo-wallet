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
  MemoID,
  MemoText,
} from 'stellar-sdk'
import { StellarTomlResolver } from 'stellar-sdk'
import { each as loEach } from 'lodash-es'

import { Buffer } from 'buffer'

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
    this.logger.response(tomlURL.toString(), toml)

    this.assets.set(`${assetCode}:${assetIssuer}`, { homeDomain, toml })

    const challengeJson = await fetch(
      `${toml.WEB_AUTH_ENDPOINT}?account=${this.account.publicKey}`
    ).then((r) => r.json())
    const txn = new Transaction(
      challengeJson.transaction,
      challengeJson.network_passphrase
    )
    txn.sign(keypair)
    const signedChallenge = txn.toXDR()
    const tokenJson = await fetch(`${toml.WEB_AUTH_ENDPOINT}`, {
      method: 'POST',
      body: JSON.stringify({ transaction: signedChallenge }),
      headers: { 'Content-Type': 'application/json' },
    }).then((r) => r.json())
    const auth = tokenJson.token

    const formData = new FormData()
    loEach(
      {
        asset_code: assetCode,
        account: this.account.publicKey,
        lang: 'en',
      },
      (value, key) => formData.append(key, value)
    )
    const interactive = await fetch(
      `${toml.TRANSFER_SERVER_SEP0024}/transactions/withdraw/interactive`,
      {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      }
    ).then((r) => r.json())

    const urlBuilder = new URL(interactive.url)
    const popup = open(urlBuilder.toString(), 'popup', 'width=500,height=800')
    if (!popup) {
      finish()
      throw "Popups are blocked. You'll need to enable popups for this demo to work"
    }

    let currentStatus = 'incomplete'
    const transactionUrl = new URL(
      `${toml.TRANSFER_SERVER_SEP0024}/transaction?id=${interactive.id}`
    )
    this.logger.instruction(`Polling for updates: ${transactionUrl.toString()}`)
    while (!popup.closed && !['completed', 'error'].includes(currentStatus)) {
      let response = await fetch(transactionUrl.toString(), {
        headers: { Authorization: `Bearer ${auth}` },
      })
      let transactionJson = await response.json()
      if (transactionJson.transaction.status !== currentStatus) {
        currentStatus = transactionJson.transaction.status
        popup.location.href = transactionJson.transaction.more_info_url
        this.logger.instruction(
          `Transaction ${interactive.id} is in ${transactionJson.transaction.status} status`
        )
        switch (currentStatus) {
          case 'pending_user_transfer_start': {
            this.logger.instruction(
              'The anchor is waiting for you to send the funds for withdrawal'
            )
            let memo = getMemo(
              transactionJson.transaction.withdraw_memo,
              transactionJson.transaction.withdraw_memo_type
            )
            this.logger.request(
              'Fetching account sequence number',
              keypair.publicKey()
            )
            const { sequence } = await this.server
              .accounts()
              .accountId(keypair.publicKey())
              .call()
            this.logger.response('Fetching account sequence number', sequence)
            const account = new Account(keypair.publicKey(), sequence)
            const txn = new TransactionBuilder(account, {
              fee: BASE_FEE,
              networkPassphrase: this.network_passphrase,
            })
              .addOperation(
                Operation.payment({
                  destination:
                    transactionJson.transaction.withdraw_anchor_account,
                  asset: new Asset(assetCode, assetIssuer),
                  amount: transactionJson.transaction.amount_in,
                })
              )
              .addMemo(memo)
              .setTimeout(0)
              .build()

            txn.sign(keypair)
            this.logger.request(
              'Submitting withdrawal transaction to Stellar',
              txn
            )
            const horizonResponse = await this.server.submitTransaction(txn)
            this.logger.response(
              'Submitting withdrawal transaction to Stellar',
              horizonResponse
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

    await this.updateAccount()
    finish()
  } catch (err) {
    finish()
    this.error = handleError(err)
  }
}

function getMemo(memoString: string, memoType: string): Memo {
  let memo
  if (memoType === 'hash') {
    memo = new Memo(MemoHash, Buffer.from(memoString, 'base64').toString('hex'))
  } else if (memoType === 'id') {
    memo = new Memo(MemoID, memoString)
  } else if (memoType === 'text') {
    memo = new Memo(MemoText, memoString)
  } else {
    throw `Invalid memo_type: ${memoString} (${memoType})`
  }
  return memo
}
