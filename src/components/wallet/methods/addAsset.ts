import { handleError } from '@services/error'
import { Wallet } from '../wallet'
import { set } from '@services/storage'
import getAssetAndIssuer from './getAssetIssuer'

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
    let account = await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
    let assetTrusted = false
    account.balances.forEach((b) => {
      if (b.asset_type === 'native') {
        return
      } else {
        assetTrusted =
          `${b.asset_code}:${b.asset_issuer}` ==
          `${addAsset.asset_code}:${addAsset.asset_issuer}`
            ? true
            : false
      }
    })
    if (!this.UntrustedAssets.has(`${asset}:${issuer}`) && !assetTrusted) {
      this.UntrustedAssets.set(
        `${addAsset.asset_code}:${addAsset.asset_issuer}`,
        {
          asset_code: addAsset.asset_code,
          asset_issuer: addAsset.asset_issuer,
          balance: '0.0000000',
          asset_type: addAsset.asset_type,
          is_authorized: true,
          untrusted: true,
        }
      )
      let UNTRUSTEDASSETS = {}
      this.UntrustedAssets.forEach((value, key) => {
        UNTRUSTEDASSETS[key] = value
      })
      set('UNTRUSTEDASSETS[keystore]', btoa(JSON.stringify(UNTRUSTEDASSETS)))
    }
    finish()
  } catch (err) {
    this.error = handleError(err)
    this.logger.error('Error in add asset', err)
    finish()
    throw err
  }
}
