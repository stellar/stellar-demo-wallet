import { Component, State, Prop } from '@stencil/core'
import { Server, ServerApi, Networks } from 'stellar-sdk'
import { ILogger } from '../logview/logview'

import componentWillLoad from './events/componentWillLoad'
import render from './events/render'

import createAccount from './methods/createAccount'
import updateAccount from './methods/updateAccount'
import depositAsset from './methods/depositAsset'
import claimAsset from './methods/claimAsset'
import withdrawAsset from './methods/withdrawAsset'
import trustAsset from './methods/trustAsset'
import addAsset from './methods/addAsset'
import makePayment from './methods/makePayment'
import makeRegulatedPayment from './methods/makeRegulatedPayment'
import copyAddress from './methods/copyAddress'
import copySecret from './methods/copySecret'
import signOut from './methods/signOut'
import setPrompt from './methods/setPrompt'
import loadAccount from './methods/loadAccount'
import popup from './methods/popup'
import switchNetworks from './methods/switchNetworks'

import { Prompter } from '@prompt/prompt'

const MockLogger = {
  request: (url, body) => {
    console.log('Request', url, body)
  },
  response: (url, body) => {
    console.log('Response', url, body)
  },
  instruction: (title, body) => {
    console.log('Instruction', title, body)
  },
  error: (url, body) => {
    console.error('Error', url, body)
  },
}

export interface Balance {
  balance: string
  is_authorized: boolean
  asset_type: string
  asset_code: string
  asset_issuer: string
  untrusted: boolean
}

interface StellarAccount {
  publicKey: string
  secretKey: string
  state?: ServerApi.AccountRecord
  claimableBalances?: ServerApi.ClaimableBalanceRecord[]
}

export interface WalletAssetDetails {
  homeDomain?: string
  toml?: any
}

interface Loading {
  create?: boolean
  load?: boolean
  pay?: boolean
  trust?: boolean
  update?: boolean
  deposit?: boolean
  withdraw?: boolean
  claim?: boolean
}

@Component({
  tag: 'stellar-wallet',
  styleUrl: 'wallet.scss',
  shadow: true,
})
export class Wallet {
  @State() account: StellarAccount
  @State() prompter: Prompter = { show: false, inputs: [] }
  @State() loading: Loading = {}
  @State() error: any
  @State() promptContents: string = null

  @Prop() server: Server = new Server('https://horizon-testnet.stellar.org')
  @Prop() network_passphrase: string = Networks.TESTNET
  @Prop() assets: Map<string, WalletAssetDetails> = new Map()
  @Prop() UntrustedAssets: Map<string, Balance> = new Map()

  // Component events
  componentWillLoad() {}
  render() {}

  @Prop()
  logger: ILogger = MockLogger

  // Stellar methods
  createAccount = createAccount
  loadAccount = loadAccount
  updateAccount = updateAccount
  depositAsset = depositAsset
  withdrawAsset = withdrawAsset
  claimAsset = claimAsset
  trustAsset = trustAsset
  addAsset = addAsset
  makePayment = makePayment
  makeRegulatedPayment = makeRegulatedPayment
  copyAddress = copyAddress
  copySecret = copySecret
  signOut = signOut
  switchNetworks = switchNetworks

  // Misc methods
  setPrompt = setPrompt
  popup = popup
}

Wallet.prototype.componentWillLoad = componentWillLoad
Wallet.prototype.render = render
