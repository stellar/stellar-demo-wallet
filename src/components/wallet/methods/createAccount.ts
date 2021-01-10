import { Keypair } from 'stellar-sdk'

import { set } from '@services/storage'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function createAccount(this: Wallet) {
  try {
    this.error = null
    this.loading = { ...this.loading, create: true }

    const keypair = Keypair.random()

    await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
    this.loading = { ...this.loading, create: false }

    this.account = {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    }
    this.assets.set('XLM', {})

    set('WALLET[keystore]', btoa(JSON.stringify(this.account)))

    history.replaceState(null, '', `?secretKey=${this.account.secretKey}`)
    await this.updateAccount()
  } catch (err) {
    this.loading = { ...this.loading, create: false }
    this.error = handleError(err)
  }
}
