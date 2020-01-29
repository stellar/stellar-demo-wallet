import {
  Component,
  State,
  Prop
} from '@stencil/core'
import {
  Server,
  ServerApi,
} from 'stellar-sdk'

import componenetWillLoad from './events/componentWillLoad'
import render from './events/render'

import createAccount from './methods/createAccount'
import updateAccount from './methods/updateAccount'
import makePayment from './methods/makePayment'
import trustAsset from './methods/trustAsset'
import copySecret from './methods/copySecret'
import setPrompt from './methods/setPrompt'

import { Prompter } from '@prompt/prompt'

interface StellarAccount {
  publicKey: string,
  keystore: string,
  state?: ServerApi.AccountRecord
}

interface Loading {
  fund?: boolean,
  pay?: boolean,
  update?: boolean,
  trust?: boolean
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
  componentWillLoad = componenetWillLoad
  render = render

  // Stellar methods
  createAccount = createAccount
  updateAccount = updateAccount
  makePayment = makePayment
  trustAsset = trustAsset

  // Misc methods
  copySecret = copySecret
  setPrompt = setPrompt
}