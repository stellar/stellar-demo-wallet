import {
  omit as loOmit,
  // find as loFind,
  // map as loMap
} from 'lodash-es'

import { Keypair, Networks } from 'stellar-sdk'
import { handleError } from '@services/error'
import { set, get } from '@services/storage'
import { Wallet } from '../wallet'

export default async function updateAccount(
  this: Wallet,
  { displayPrompt }: { displayPrompt?: boolean } = {}
) {
  try {
    this.error = null
    this.loading = { ...this.loading, update: true }
    let keypair

    if (displayPrompt || !this.account.secretKey) {
      let inputs = await this.setPrompt({
        message: 'Enter your Stellar secret key',
      })
      let secret = inputs[0].value
      try {
        keypair = Keypair.fromSecret(secret)
      } catch (e) {
        throw 'Invalid secret key'
      }
      this.account = {
        ...this.account,
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      }
      let query = `?secretKey=${this.account.secretKey}`
      if (this.network_passphrase === Networks.PUBLIC) {
        query += `&pubnet=true`
      }
      history.replaceState(null, '', query)
      set('WALLET[keystore]', btoa(JSON.stringify(this.account)))
      set(
        'UNTRUSTEDASSETS[keystore]',
        btoa(JSON.stringify(this.UntrustedAssets))
      )
    }

    let account = await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
    let claimableBalanceResp = await this.server
      .claimableBalances()
      .claimant(this.account.publicKey)
      .call()
    claimableBalanceResp.records.forEach((record) => {
      this.logger.response(
        'Claimable Balances Available ',
        loOmit(record, ['_links', 'paging_token', 'self'])
      )
    })
    this.account = {
      ...this.account,
      state: loOmit(account, ['id', '_links', 'account_id', 'paging_token']),
      claimableBalances: claimableBalanceResp.records,
    }
    // Restores the UntrustedAssets prop from storage
    const UNTRUSTEDASSETS = await get('UNTRUSTEDASSETS[keystore]')
    this.UntrustedAssets = new Map(
      Object.entries(JSON.parse(atob(UNTRUSTEDASSETS)))
    )
    account.balances.forEach((b) => {
      if (b.asset_type === 'native') {
        this.assets.set('XLM', {})
        return
      }
      if (!this.assets.get(`${b.asset_code}:${b.asset_issuer}`))
        this.assets.set(`${b.asset_code}:${b.asset_issuer}`, {})
    })
    this.loading = { ...this.loading, update: false }
  } catch (err) {
    this.error = handleError(err)
  }
}
