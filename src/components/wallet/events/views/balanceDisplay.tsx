import { h } from '@stencil/core'
import { has as loHas } from 'lodash-es'

interface Balance {
  balance: string
  is_authorized: boolean
  asset_type: string
  asset_code: string
  asset_issuer: string
}

export default function BalanceDisplay() {
  const balanceRow = (balance: Balance) => {
    const name = balance.asset_type === 'native' ? 'XLM' : balance.asset_code
    return (
      <div class="balance-row">
        <div class="asset-code">{name}</div>
        <div class="balance">{parseFloat(balance.balance).toFixed(2)}</div>
        <button
          onClick={() => this.makePayment(null, name, balance.asset_issuer)}
        >
          Send
        </button>
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
