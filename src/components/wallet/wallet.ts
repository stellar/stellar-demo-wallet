import {
  Component,
  State,
  Prop
} from '@stencil/core'
import {
  Server,
  ServerApi,
} from 'stellar-sdk'

import componentWillLoad from './events/componentWillLoad'
import render from './events/render'

import createAccount from './methods/createAccount'
import updateAccount from './methods/updateAccount'
import trustAsset from './methods/trustAsset' // NEW
import makePayment from './methods/makePayment' // UPDATE
import copyAddress from './methods/copyAddress'
import copySecret from './methods/copySecret'
import signOut from './methods/signOut'
import setPrompt from './methods/setPrompt'

import { Prompter } from '@prompt/prompt'

interface StellarAccount {
  publicKey: string,
  keystore: string,
  state?: ServerApi.AccountRecord,
}

interface Loading { // UPDATE
  fund?: boolean,
  pay?: boolean,
  trust?: boolean, // NEW
  update?: boolean,
}

@Component({
  tag: 'stellar-wallet',
  styleUrl: 'wallet.scss',
  shadow: true
})
export class Wallet {
  @State() account: StellarAccount
  @State() prompter: Prompter = {show: false}
  @State() loading: Loading = {}
  @State() error: any = null

  @Prop() server: Server

  // Component events
  componentWillLoad() {}
  render() {}

  // Stellar methods
  createAccount = createAccount
  updateAccount = updateAccount
  trustAsset = trustAsset // NEW
  makePayment = makePayment // UPDATE
  copyAddress = copyAddress
  copySecret = copySecret
  signOut = signOut

  // Misc methods
  setPrompt = setPrompt
}

Wallet.prototype.componentWillLoad = componentWillLoad
Wallet.prototype.render = render