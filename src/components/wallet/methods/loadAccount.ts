import axios from 'axios'
import { Keypair } from 'stellar-sdk'

import { set } from '@services/storage'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function createAccount(this: Wallet) {
  try {
    let inputs = await this.setPrompt({
      message: 'Enter your Stellar secret key',
    })
    const secret = inputs[0].value

    let keypair
    try {
      keypair = Keypair.fromSecret(secret)
    } catch (e) {
      throw 'Invalid secret key'
    }

    this.error = null
    this.loading = { ...this.loading, load: true }

    await axios(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
      .catch(() => null) // If account already exists don't catch the error
      .finally(() => (this.loading = { ...this.loading, load: false }))

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
