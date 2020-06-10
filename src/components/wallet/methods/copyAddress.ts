import copy from 'copy-to-clipboard'

export default async function copyAddress() {
  copy(this.account.publicKey)
}