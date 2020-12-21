import { Keypair } from 'stellar-sdk'
import { StellarTomlResolver } from 'stellar-sdk'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'
import { PromptInput } from '@prompt/promptInput'
import { set } from '@services/storage'

async function getAssetAndIssuer(wallet: Wallet) {
  // collect user input
  let inputs
  try {
    inputs = await wallet.setPrompt({
      message: 'REQUIRED: asset code AND (home domain OR issuer)',
      inputs: [
        new PromptInput('asset code (ex. USD)'),
        new PromptInput('anchor home domain (ex. example.com)'),
        new PromptInput('issuer public key'),
      ],
    })
  } catch (e) {
    return null
  }
  let asset = inputs[0].value
  let homeDomain = inputs[1].value
  let issuer = inputs[2].value

  // if a valid issuer is provied, return
  if (issuer) {
    Keypair.fromPublicKey(issuer)
    return [asset, issuer]
  }
  // if the provided home domain is invalid, throw an error
  homeDomain = homeDomain.startsWith('http')
    ? homeDomain
    : 'https://' + homeDomain
  homeDomain =
    homeDomain[homeDomain.length - 1] !== '/'
      ? homeDomain
      : homeDomain.slice(0, -1)

  let homeDomainURL
  try {
    homeDomainURL = new URL(homeDomain)
  } catch (e) {
    throw 'anchor home domain is not a valid URL using HTTPS'
  }

  // if the issuer was not provided, extract if from the home domain's TOML
  if (!issuer && homeDomain) {
    const toml =
      homeDomainURL.protocol == 'http:'
        ? await StellarTomlResolver.resolve(homeDomainURL.host, {
            allowHttp: true,
          })
        : await StellarTomlResolver.resolve(homeDomainURL.host)
    if (!toml.CURRENCIES) {
      throw "the home domain specified does not have a CURRENCIES section on it's TOML file"
    }
    for (let c of toml.CURRENCIES) {
      if (c.code === asset) {
        issuer = c.issuer
        break
      }
    }
    if (!issuer)
      throw `unable to find the ${asset} issuer on the home domain's TOML file`
    // update here because homeDomain and toml are not fetched during updateAccount()
    wallet.assets.set(`${asset}:${issuer}`, { homeDomain, toml })
  }
  return [asset, issuer]
}

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
    this.balance.set(asset, {
      asset_code: addAsset.asset_code,
      asset_issuer: addAsset.asset_issuer,
      balance: '0.0000000',
      asset_type: addAsset.asset_type,
      is_authorized: true,
    })
    set(
      'BALANCE[keystore]',
      btoa(JSON.stringify(Array.from(this.balance.entries())))
    )
    await this.updateAccount()
    finish()
  } catch (err) {
    this.error = handleError(err)
    this.logger.error('Error in add asset', err)
    finish()
    throw err
  }
}
