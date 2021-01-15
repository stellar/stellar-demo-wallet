import { omit as loOmit } from 'lodash-es'

import { Keypair, Networks } from 'stellar-sdk'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function updateAccount(
  this: Wallet,
  { displayPrompt }: { displayPrompt?: boolean } = {}
) {
  try {
    this.error = null
    this.loading = { ...this.loading, update: true }

    if (displayPrompt) {
      let inputs = await this.setPrompt({
        message: 'Enter your Stellar secret key',
      })
      let secret = inputs[0].value
      let keypair
      try {
        keypair = Keypair.fromSecret(secret)
      } catch (e) {
        throw 'Invalid secret key'
      }
      this.account = {
        ...this.account,
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      }
      let query = `?secretKey=${this.account.secretKey}`
      if (this.network_passphrase === Networks.PUBLIC) {
        query += `&pubnet=true`
      }
      history.replaceState(null, '', query)
    }

    let account = await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
    let claimableBalanceResp = await this.server
      .claimableBalances()
      .claimant(this.account.publicKey)
      .call()
    claimableBalanceResp.records.forEach((record) => {
      this.logger.response(
        'Claimable Balances Available ',
        loOmit(record, ['_links', 'paging_token', 'self'])
      )
    })
    this.account = {
      ...this.account,
      state: loOmit(account, ['id', '_links', 'account_id', 'paging_token']),
      claimableBalances: claimableBalanceResp.records,
    }
    account.balances.forEach((b) => {
      if (b.asset_type === 'native') {
        this.assets.set('XLM', {})
        return
      }
      if (!this.assets.get(`${b.asset_code}:${b.asset_issuer}`))
        this.assets.set(`${b.asset_code}:${b.asset_issuer}`, {})
    })
    let query
    try {
      query = Object.fromEntries(new URLSearchParams(location.search).entries())
    } catch {
      throw 'Unable to parse query string'
    }
    if (!query.untrustedAssets) {
      this.loading = { ...this.loading, update: false }
      return
    }
    let untrustedAssetsIds = query.untrustedAssets.split(',')
    let actualUntrustedAssetIds = []
    for (const untrustedAssetId of untrustedAssetsIds) {
      console.log(this.assets)
      if (this.assets.has(untrustedAssetId)) {
        this.logger.instruction(`Asset ${untrustedAssetId} is trusted.`)
        if (this.untrustedAssets.has(untrustedAssetId))
          this.untrustedAssets.delete(untrustedAssetId)
        continue
      }
      let [assetCode, assetIssuer] = untrustedAssetId.split(':')
      this.logger.instruction(`Loading asset ${untrustedAssetId}...`)
      let assetRes = await this.server
        .assets()
        .forCode(assetCode)
        .forIssuer(assetIssuer)
        .call()
      if (!assetRes.records) {
        this.logger.instruction(`Asset ${untrustedAssetId} does not exist.`)
        continue
      }
      let asset = assetRes.records[0]
      if (!this.untrustedAssets.has(untrustedAssetId)) {
        this.untrustedAssets.set(`${assetCode}:${assetCode}`, {
          asset_code: assetCode,
          asset_issuer: assetIssuer,
          balance: '0.0000000',
          asset_type: asset.asset_type,
          untrusted: true,
        })
      }
      actualUntrustedAssetIds.push(untrustedAssetId)
    }
    if (actualUntrustedAssetIds.length) {
      query.untrustedAssets = actualUntrustedAssetIds.join()
    } else {
      delete query.untrustedAssets
    }
    history.replaceState(null, '', '?' + new URLSearchParams(query).toString())
    this.loading = { ...this.loading, update: false }
  } catch (err) {
    this.error = handleError(err)
  }
}
