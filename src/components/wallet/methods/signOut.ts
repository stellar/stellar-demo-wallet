import { remove } from '@services/storage'

import { handleError } from '@services/error'

export default async function copySecret(e: Event) {
  try {
    e.preventDefault()
    await remove('keyStore')
    location.reload()
  }

  catch (err) {
    this.error = handleError(err)
  }
}