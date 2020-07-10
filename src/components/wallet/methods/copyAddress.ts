import copy from 'copy-to-clipboard'
import { Wallet } from '../wallet'

export default async function copyAddress(this: Wallet) {
  copy(this.account.publicKey)
  this.logger.instruction('Copying public key ', this.account.publicKey)
}
