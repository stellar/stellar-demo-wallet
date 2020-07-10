import axios from 'axios'
import { Keypair } from 'stellar-sdk'

import { set } from '@services/storage'
import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { encrypt } from '@services/tweetnacl'
import { Wallet } from '../wallet'

export default async function createAccount(this: Wallet) {
  try {
    const secret = await this.setPrompt({
      message: 'Enter your Stellar secret key',
    })
    let keypair

    try {
      keypair = Keypair.fromSecret(secret)
    } catch (e) {
      throw 'Invalid secret key'
    }
    const pincode_1 = await this.setPrompt({
      message: 'Enter an account pincode',
      type: 'password',
    })
    const pincode_2 = await this.setPrompt({
      message: 'Enter account pincode again',
      type: 'password',
    })

    if (!pincode_1 || !pincode_2 || pincode_1 !== pincode_2)
      throw 'Invalid pincode'

    this.error = null
    this.loading = { ...this.loading, load: true }

    const pincode_stretched = await stretchPincode(
      pincode_1,
      keypair.publicKey()
    )
    const { cipher, nonce } = encrypt(
      keypair.rawSecretKey(),
      keypair.rawPublicKey(),
      pincode_stretched
    )

    await axios(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
      .catch(() => null) // If account already exists don't catch the error
      .finally(() => (this.loading = { ...this.loading, load: false }))

    this.account = {
      publicKey: keypair.publicKey(),
      cipher,
      nonce,
    }

    set('WALLET[keystore]', btoa(JSON.stringify(this.account)))

    this.updateAccount()
  } catch (err) {
    this.error = handleError(err)
  }
}
