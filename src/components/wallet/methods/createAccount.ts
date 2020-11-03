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

    set('WALLET[keystore]', btoa(JSON.stringify(this.account)))

    this.updateAccount()
  } catch (err) {
    this.error = handleError(err)
  }
}
