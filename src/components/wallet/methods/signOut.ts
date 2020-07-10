import { remove } from '@services/storage'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function signOut(this: Wallet) {
  try {
    const confirmNuke = await this.setPrompt({
      message: 'Are you sure? This will nuke your account',
      placeholder: 'Enter NUKE to confirm',
    })

    if (!confirm || !/nuke/gi.test(confirmNuke)) throw 'Cannot sign out'

    this.error = null

    await remove('WALLET[keystore]')
    sessionStorage.removeItem('WALLET[pincode]')
    location.reload()
  } catch (err) {
    this.error = handleError(err)
  }
}
