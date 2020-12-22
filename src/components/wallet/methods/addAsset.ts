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
    await this.updateAccount()
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
    if (!this.balance.has(`${asset}:${issuer}`)) {
      this.balance.set(`${addAsset.asset_code}:${addAsset.asset_issuer}`, {
        asset_code: addAsset.asset_code,
        asset_issuer: addAsset.asset_issuer,
        balance: '0.0000000',
        asset_type: addAsset.asset_type,
        is_authorized: true,
        trusted: false,
      })
      set(
        'BALANCE[keystore]',
        btoa(JSON.stringify(Array.from(this.balance.entries())))
      )
    }
    await this.updateAccount()
    finish()
  } catch (err) {
    this.error = handleError(err)
    this.logger.error('Error in add asset', err)
    finish()
    throw err
  }
}
