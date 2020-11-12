import { h } from '@stencil/core'
import { has as loHas } from 'lodash-es'
import WalletButton from './walletButton'
import { Wallet } from '../wallet'

interface ClaimableBalance {
  id: string
  asset: string
  amount: string
  sponsor?: string
  claimants: any[]
}

export default function claimableDisplay(this: Wallet) {
  if (this.account.availableBalances) {
    const claimableRecords = (claimableBalances: any) => {
      return claimableBalances.records.map(claimableBalanceRow)
    }
    const claimableBalanceRow = (balance: ClaimableBalance) => {
      const loadingKey = (type: string) => {
        return `${type}:${balance.asset.split(':')[0]}:${balance.id}`
      }
      const assetCode = balance.asset.split(':')[0]
      const claimBalanceButton = WalletButton.call(
        this,
        'Claim',
        loadingKey('claim'),
        () => {
          this.claimAsset(
            balance.id,
            assetCode,
            balance.sponsor,
            balance.amount
          )
        }
      )
      return (
        <div class="asset-row">
          <div class="balance-row">
            <div class="asset-code">{assetCode}:</div>
            <div class="balance">{balance.amount}</div>
          </div>
          <div class="actions">{claimBalanceButton}</div>
        </div>
      )
    }

    return (
      <div>
        {loHas(this.account, 'claimableBalances') ? (
          <pre class="account-state">
            <h2 class="balance-headers">Claimable Balances</h2>
            {claimableRecords(this.account.claimableBalances)}
          </pre>
        ) : null}
      </div>
    )
  }
}
