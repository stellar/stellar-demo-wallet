import axios from 'axios'
import { Keypair } from 'stellar-sdk'

import { set } from '@services/storage'
import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { encrypt } from '@services/tweetnacl'

export default async function createAccount(e: Event) {
  try {
    e.preventDefault()

    const pincode_1 = await this.setPrompt('Enter an account pincode')
    const pincode_2 = await this.setPrompt('Enter account pincode again')

    if (
      !pincode_1
      || !pincode_2
      || pincode_1 !== pincode_2
    ) throw 'Invalid pincode'

    this.error = null
    this.loading = {...this.loading, fund: true}

    const keypair = Keypair.random()
    const pincode_stretched = await stretchPincode(pincode_1, keypair.publicKey())

    await axios(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
    .finally(() => this.loading = {...this.loading, fund: false})

    this.account = {
      publicKey: keypair.publicKey(),
      cipher: encrypt(
        keypair.secret(),
        keypair.publicKey(),
        pincode_stretched
      )
    }

    set('WALLET[keystore]', btoa(JSON.stringify(this.account)))

    this.updateAccount()
  }

  catch(err) {
    this.error = handleError(err)
  }
}