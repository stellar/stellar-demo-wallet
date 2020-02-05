import copy from 'copy-to-clipboard'

export default async function copySecret(e: Event) {
  e.preventDefault()
  copy(this.account.publicKey)
}