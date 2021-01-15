import { Keypair } from 'stellar-sdk'
import { StellarTomlResolver } from 'stellar-sdk'
import { Wallet } from '../wallet'
import { PromptInput } from '@prompt/promptInput'

export default async function getAssetAndIssuer(wallet: Wallet) {
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
  if (!asset || !(issuer || homeDomain))
    throw 'REQUIRED: asset code AND (home domain OR issuer)'

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

  return [asset, issuer]
}
