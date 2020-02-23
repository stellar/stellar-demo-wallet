import axios from 'axios'
import { Keypair } from 'stellar-sdk'

import { set } from '@services/storage'
import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { encrypt } from '@services/tweetnacl'

export default async function createAccount() {
  try {
    const pincode_1 = await this.setPrompt({
      message: 'Enter an account pincode',
      type: 'password'
    })
    const pincode_2 = await this.setPrompt({
      message: 'Enter account pincode again',
      type: 'password'
    })

    if (
      !pincode_1
      || !pincode_2
      || pincode_1 !== pincode_2
    ) throw 'Invalid pincode'

    this.error = null
    this.loading = {...this.loading, fund: true}

    const keypair = Keypair.random()
    const pincode_stretched = await stretchPincode(pincode_1, keypair.publicKey())
    const { cipher, nonce } = encrypt(
      keypair.rawSecretKey(),
      keypair.rawPublicKey(),
      pincode_stretched
    )

    await axios(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
    .finally(() => this.loading = {...this.loading, fund: false})

    this.account = {
      publicKey: keypair.publicKey(),
      cipher,
      nonce
    }

    set('WALLET[keystore]', btoa(JSON.stringify(this.account)))

    this.updateAccount()
  }

  catch(err) {
    this.error = handleError(err)
  }
}