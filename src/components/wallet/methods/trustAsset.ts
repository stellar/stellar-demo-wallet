import {
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
  Keypair,
} from 'stellar-sdk'
import { StellarTomlResolver } from 'stellar-sdk'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'
import { PromptInput } from '@prompt/promptInput'

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
  homeDomain = homeDomain.startsWith('https')
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
    let toml = await StellarTomlResolver.resolve(homeDomainURL.host)
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
    wallet.assets.set({ code: asset, issuer: issuer }, { homeDomain, toml })
  }

  return [asset, issuer]
}

export default async function trustAsset(
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
    this.logger.instruction(
      'Loading account to get sequence number for trust transaction'
    )
    const keypair = Keypair.fromSecret(this.account.secretKey)
    const account = await this.server.loadAccount(keypair.publicKey())
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.changeTrust({
          asset: new Asset(asset, issuer),
        })
      )
      .setTimeout(0)
      .build()
    transaction.sign(keypair)
    this.logger.request('Submitting changeTrust transaction', transaction)
    const result = await this.server.submitTransaction(transaction)
    this.logger.response('Submitted changeTrust transaction', result)
    await this.updateAccount()
    finish()
  } catch (err) {
    this.error = handleError(err)
    this.logger.error('Error in trust transaction', err)
    finish()
    throw err
  }
}
