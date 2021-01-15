import axios from 'axios'
import { Keypair } from 'stellar-sdk'

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

    history.replaceState(null, '', `?secretKey=${this.account.secretKey}`)
    await this.updateAccount()
  } catch (err) {
    this.error = handleError(err)
  }
}
