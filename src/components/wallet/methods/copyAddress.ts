import copy from 'copy-to-clipboard'

export default async function copyAddress() {
  copy(this.account.publicKey)
  this.logger.instruction('Copying public key ' + this.account.publicKey)
}
