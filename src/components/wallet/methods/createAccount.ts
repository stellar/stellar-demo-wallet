import sjcl from 'sjcl'
import axios from 'axios'
import { Keypair } from 'stellar-sdk'

import { handleError } from '@services/error'
import { set } from '@services/storage'

export default async function createAccount(e: Event) {
  try {
    e.preventDefault()

    const pincode = await this.setPrompt('Enter a keystore pincode')

    if (!pincode)
      return

    this.error = null
    this.loading = {...this.loading, fund: true}

    const keypair = Keypair.random()

    await axios(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
    .finally(() => this.loading = {...this.loading, fund: false})

    this.account = {
      publicKey: keypair.publicKey(),
      keystore: sjcl.encrypt(pincode, keypair.secret(), {
        adata: JSON.stringify({
          publicKey: keypair.publicKey()
        })
      })
    }

    await set('keyStore', btoa(this.account.keystore))

    this.updateAccount()
  }

  catch(err) {
    this.error = handleError(err)
  }
}