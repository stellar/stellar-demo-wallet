import { handleError } from '@services/error'
import { Wallet } from '../wallet'
import { set } from '@services/storage'
import getAssetAndIssuer from './getAssetIssuer'
import { get as loGet, findIndex as loFindIndex } from 'lodash-es'

export default async function addAsset(
  this: Wallet,
  asset?: string,
  issuer?: string
) {
  this.loading = { ...this.loading, trust: true }
  this.error = null
  const finish = () => (this.loading = { ...this.loading, trust: false })
  try {
    if (!asset || !issuer) {
      let nullOrData = await getAssetAndIssuer(this)
      if (!nullOrData) {
        finish()
        return nullOrData
      }
      ;[asset, issuer] = nullOrData
    }
    let assetRes = await this.server
      .assets()
      .forCode(asset.split(':')[0])
      .forIssuer(issuer)
      .call()
    this.logger.instruction('Loading asset to be added')
    let addAsset = assetRes.records[0]
    // Check if asset attempted to be added
    // is already a trusted asset
    const balances = loGet(this.account, 'state.balances')
    const hasAsset = loFindIndex(balances, {
      asset_code: asset,
      asset_issuer: issuer,
    })
    if (!this.UntrustedAssets.has(`${asset}:${issuer}`) && hasAsset === -1) {
      this.UntrustedAssets.set(
        `${addAsset.asset_code}:${addAsset.asset_issuer}`,
        {
          asset_code: addAsset.asset_code,
          asset_issuer: addAsset.asset_issuer,
          balance: '0.0000000',
          asset_type: addAsset.asset_type,
          untrusted: true,
        }
      )
      set(
        'UNTRUSTEDASSETS[keystore]',
        btoa(JSON.stringify(Object.fromEntries(this.UntrustedAssets.entries())))
      )
    }
    finish()
  } catch (err) {
    this.error = handleError(err)
    this.logger.error('Error in add asset', err)
    finish()
    throw err
  }
}
