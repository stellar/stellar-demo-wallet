import { remove } from '@services/storage'
import { handleError } from '@services/error'

export default async function signOut(e: Event) {
  try {
    e.preventDefault()

    const confirmNuke = await this.setPrompt('Are you sure? This will nuke your account', 'Enter NUKE to confirm')

    if (
      !confirm
      || !/nuke/gi.test(confirmNuke)
    ) return

    this.error = null

    await remove('keyStore')
    location.reload()
  }

  catch (err) {
    this.error = handleError(err)
  }
}