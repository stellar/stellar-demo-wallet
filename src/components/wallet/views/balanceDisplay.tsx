import { h } from '@stencil/core'
import { has as loHas } from 'lodash-es'
import WalletButton from './walletButton'
import { Wallet } from '../wallet'

export default function balanceDisplay(this: Wallet) {
  let totalBalances = []
  // Combines the two arrays of different types
  // to allow balanceRow to iterate and map
  // their values in the view
  if (this.account.state) {
    totalBalances = Array.from(this.account.state.balances)
  }
  if (this.untrustedAssets.values) {
    totalBalances = totalBalances.concat(
      Array.from(this.untrustedAssets.values())
    )
  }
  const balanceRow = (balance: any) => {
    const loadingKey = (type: string) => {
      return `${type}:${balance.asset_code}:${balance.asset_issuer}`
    }
    const assetCode =
      balance.asset_type === 'native' ? 'XLM' : balance.asset_code

    const sendButton = balance.untrusted
      ? null
      : WalletButton.call(this, 'Send', loadingKey('send'), () =>
          this.makePayment(null, assetCode, balance.asset_issuer)
        )
    const trustButton = balance.untrusted
      ? WalletButton.call(this, 'Trust Asset', loadingKey('trust'), () =>
          this.trustAsset(balance.asset_code, balance.asset_issuer)
        )
      : null
    const depositButton =
      balance.asset_type === 'native'
        ? null
        : WalletButton.call(this, 'Deposit', loadingKey('deposit'), () => {
            this.depositAsset(balance.asset_code, balance.asset_issuer)
          })
    const withdrawButton =
      balance.asset_type === 'native' || balance.untrusted
        ? null
        : WalletButton.call(this, 'Withdraw', loadingKey('withdraw'), () => {
            this.withdrawAsset(balance.asset_code, balance.asset_issuer)
          })
    return (
      <div class="asset-row">
        <div class="balance-row">
          <div class="asset-code">{assetCode}:</div>
          <div class="balance">{balance.balance}</div>
        </div>
        <div class="actions">
          {sendButton}
          {trustButton}
          {depositButton}
          {withdrawButton}
        </div>
      </div>
    )
  }

  return (
    <div>
      {loHas(this.account, 'state') ? (
        <pre class="account-state">
          <h2 class="balance-headers">Balances</h2>
          {totalBalances.map(balanceRow)}
        </pre>
      ) : null}
    </div>
  )
}
