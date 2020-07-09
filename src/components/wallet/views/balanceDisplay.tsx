import { h } from '@stencil/core'
import { has as loHas } from 'lodash-es'

interface Balance {
  balance: string
  is_authorized: boolean
  asset_type: string
  asset_code: string
  asset_issuer: string
}

export default function balanceDisplay() {
  const balanceRow = (balance: Balance) => {
    const isRegulated =
      !balance.is_authorized && balance.asset_type !== 'native'
    const assetCode =
      balance.asset_type === 'native' ? 'XLM' : balance.asset_code

    const sendLoadingState = this.loading[
      `send:${balance.asset_code}:${balance.asset_issuer}`
    ]
    const sendButton = (
      <button
        class={sendLoadingState ? 'loading' : null}
        onClick={() => this.makePayment(null, assetCode, balance.asset_issuer)}
      >
        {sendLoadingState ? <stellar-loader /> : null}
        Send
      </button>
    )

    const sendRegulatedLoadingState = this.loading[
      `sendRegulated:${balance.asset_code}:${balance.asset_issuer}`
    ]
    const regulatedSendButton = !isRegulated ? null : (
      <button
        class={sendRegulatedLoadingState ? 'loading' : null}
        onClick={() =>
          this.makeRegulatedPayment(null, assetCode, balance.asset_issuer)
        }
      >
        {sendRegulatedLoadingState ? <stellar-loader /> : null}
        Send Regulated
      </button>
    )

    const depositWithdrawButtons =
      balance.asset_code === 'native'
        ? null
        : [<button>Deposit</button>, <button>Withdraw</button>]
    return (
      <div class="asset-row">
        <div class="balance-row">
          <div class="asset-code">{assetCode}:</div>
          <div class="balance">{balance.balance}</div>
        </div>
        <div class="actions">
          {sendButton}
          {regulatedSendButton}
          {depositWithdrawButtons}
        </div>
      </div>
    )
  }

  return (
    <div>
      {loHas(this.account, 'state') ? (
        <pre class="account-state">
          {this.account.state.balances.map(balanceRow)}
        </pre>
      ) : null}
    </div>
  )
}
