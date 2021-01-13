import axios from 'axios'
import { Keypair } from 'stellar-sdk'

import { set } from '@services/storage'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function createAccount(this: Wallet) {
  try {
    this.error = null
    this.loading = { ...this.loading, create: true }

    const keypair = Keypair.random()

    await axios(
      `https://friendbot.stellar.org?addr=${keypair.publicKey()}`
    ).finally(() => (this.loading = { ...this.loading, create: false }))

    this.account = {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    }
    this.assets.set('XLM', {})

    set('WALLET[keystore]', btoa(JSON.stringify(this.account)))
    let UNTRUSTEDASSETS = {}
    this.UntrustedAssets.forEach((value, key) => {
      UNTRUSTEDASSETS[key] = value
    })
    set('UNTRUSTEDASSETS[keystore]', btoa(JSON.stringify(UNTRUSTEDASSETS)))
    await this.updateAccount()
    // No need to check for this.network_passphrase === Networks.PUBLIC
    // since this button is not displayed when that condition is true
    history.replaceState(null, '', `?secretKey=${this.account.secretKey}`)
  } catch (err) {
    this.error = handleError(err)
  }
}
