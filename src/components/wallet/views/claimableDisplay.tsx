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
      return claimableBalances.records.map(balanceRow)
    }
    const balanceRow = (balance: ClaimableBalance) => {
      const loadingKey = (type: string) => {
        return `${type}:${balance.asset.split(':')[0]}:${balance.sponsor}`
      }
      const assetCode = balance.asset.split(':')[0]
      const claimBalanceButton = WalletButton.call(
        this,
        'Claim',
        loadingKey('Claim'),
        () => {
          this.claimAsset(balance.asset, balance.sponsor)
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
            {claimableRecords(this.account.claimableBalances)}
          </pre>
        ) : null}
      </div>
    )
  }
}
