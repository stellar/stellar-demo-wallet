import { handleError } from '@services/error'
import { Wallet } from '../wallet'
import { Keypair, Networks, Server } from 'stellar-sdk'

export default async function componentWillLoad(this: Wallet) {
  try {
    await loadAccount(this)
  } catch (err) {
    this.error = handleError(err)
  }
}

async function loadAccount(wallet: Wallet) {
  let query
  try {
    query = Object.fromEntries(new URLSearchParams(location.search).entries())
  } catch {
    throw 'Unable to parse query string'
  }
  if (query.pubnet === 'true') {
    wallet.network_passphrase = Networks.PUBLIC
    wallet.server = new Server('https://horizon.stellar.org')
  } else {
    wallet.network_passphrase = Networks.TESTNET
    wallet.server = new Server('https://horizon-testnet.stellar.org')
  }
  if (!query.secretKey) return
  let keypair
  try {
    keypair = Keypair.fromSecret(query.secretKey)
  } catch (e) {
    throw 'Invalid secret key'
  }
  wallet.account = {
    ...wallet.account,
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  }
  await wallet.updateAccount()
}
