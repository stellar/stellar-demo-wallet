import { remove } from '@services/storage'
import { handleError } from '@services/error'

export default async function signOut() {
  try {
    const confirmNuke = await this.setPrompt({
      message: 'Are you sure? This will nuke your account',
      placeholder: 'Enter NUKE to confirm'
    })

    if (
      !confirm
      || !/nuke/gi.test(confirmNuke)
    ) throw 'Cannot sign out'

    this.error = null

    await remove(`wallet.${this._id}.keystore`)
    sessionStorage.removeItem(`wallet.${this.prompter._id}.pincode`)
    location.reload()
  }

  catch (err) {
    this.error = handleError(err)
  }
}