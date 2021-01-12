import { h } from '@stencil/core'
import { has as loHas } from 'lodash-es'
import WalletButton from './walletButton'
import { Wallet, Balance } from '../wallet'

export default function balanceDisplay(this: Wallet) {
  const balanceRow = (balance: Balance) => {
    const loadingKey = (type: string) => {
      return `${type}:${balance.asset_code}:${balance.asset_issuer}`
    }
    const isRegulated =
      !balance.is_authorized && balance.asset_type !== 'native'
    const assetCode =
      balance.asset_type === 'native' ? 'XLM' : balance.asset_code

    const sendButton = !balance.trusted
      ? null
      : WalletButton.call(this, 'Send', loadingKey('send'), () =>
          this.makePayment(null, assetCode, balance.asset_issuer)
        )
    const regulatedSendButton = !isRegulated
      ? null
      : WalletButton.call(
          this,
          'Send Regulated',
          loadingKey('sendRegulated'),
          () => this.makeRegulatedPayment(null, assetCode, balance.asset_issuer)
        )
    const trustButton = !!balance.trusted
      ? null
      : WalletButton.call(this, 'Trust Asset', loadingKey('trust'), () =>
          this.trustAsset(balance.asset_code, balance.asset_issuer)
        )
    const depositButton =
      balance.asset_type === 'native'
        ? null
        : WalletButton.call(this, 'Deposit', loadingKey('deposit'), () => {
            this.depositAsset(balance.asset_code, balance.asset_issuer)
          })
    const withdrawButton =
      balance.asset_type === 'native' || !balance.trusted
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
          {regulatedSendButton}
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
          {(Array.from(this.balance.values()) as Balance[]).map(balanceRow)}
        </pre>
      ) : null}
    </div>
  )
}
