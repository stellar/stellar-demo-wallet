import { handleError } from '@services/error'
import { Wallet } from '../wallet'
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
    if (this.untrustedAssets.has(`${asset}:${issuer}`)) {
      this.logger.instruction('Asset already added.')
      finish()
      return
    }
    let assetRes = await this.server
      .assets()
      .forCode(asset.split(':')[0])
      .forIssuer(issuer)
      .call()
    this.logger.instruction(`Loading asset ${asset}:${issuer}...`)
    if (!assetRes.records) {
      throw `Asset ${asset}:${issuer} does not exist.`
    }
    this.untrustedAssets.set(`${asset}:${issuer}`, {
      asset_code: asset,
      asset_issuer: issuer,
      balance: '0.0000000',
      asset_type: assetRes.records[0].asset_type,
      untrusted: true,
    })
    let query
    try {
      query = Object.fromEntries(new URLSearchParams(location.search).entries())
    } catch {
      throw 'Unable to parse query string'
    }
    if (!query.untrustedAssets) {
      query.untrustedAssets = `${asset}:${issuer}`
    } else {
      query.untrustedAssets += `,${asset}:${issuer}`
    }
    history.replaceState(null, '', '?' + new URLSearchParams(query).toString())
    finish()
  } catch (err) {
    this.error = handleError(err)
    this.logger.error('Error in add asset', err)
    finish()
    throw err
  }
}
