import { handleError } from '@services/error'
import { get } from '@services/storage'
import { Wallet } from '../wallet'
import { Keypair, Networks, Server } from 'stellar-sdk'

export default async function componentWillLoad(this: Wallet) {
  try {
    await loadAccountFromBrowser(this)
  } catch (err) {
    this.error = handleError(err)
  }
}

async function loadAccountFromBrowser(wallet: Wallet) {
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
  if (query.secretKey) {
    await loadAccountFromSecretKey(wallet, query.secretKey)
  } else {
    await loadAccountFromKeyStore(wallet)
  }
}

async function loadAccountFromSecretKey(wallet: Wallet, secretKey: string) {
  let keypair
  try {
    keypair = Keypair.fromSecret(secretKey)
  } catch (e) {
    throw 'Invalid secret key'
  }
  // Don't reload account if the secret key hasn't changed
  if (!wallet.account || secretKey != wallet.account.secretKey) {
    wallet.account = {
      ...wallet.account,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    }
    await wallet.updateAccount()
  }
}

async function loadAccountFromKeyStore(wallet) {
  const walletKeystore = await get('WALLET[keystore]')
  if (walletKeystore) {
    wallet.account = {
      ...wallet.account,
      ...JSON.parse(atob(walletKeystore)),
    }
    wallet.updateAccount()
  }
  const UNTRUSTEDASSETS = await get('UNTRUSTEDASSETS[keystore]')
  if (UNTRUSTEDASSETS) {
    wallet.UntrustedAssets = {
      ...wallet.UntrustedAssets,
      ...new Map(Object.entries(JSON.parse(atob(UNTRUSTEDASSETS)))),
    }
    wallet.updateAccount()
  }
}
