import copy from 'copy-to-clipboard'

import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { decrypt } from '@services/tweetnacl'

export default async function copySecret() {
  try {
    const pincode = await this.setPrompt({
      message: 'Enter your account pincode',
      type: 'password'
    })
    const pincode_stretched = await stretchPincode(pincode, this.account.publicKey)

    this.error = null

    const keypair = decrypt(
      this.account.cipher,
      this.account.nonce,
      pincode_stretched
    )

    copy(keypair.secret())
  }

  catch (err) {
    this.error = handleError(err)
  }
}