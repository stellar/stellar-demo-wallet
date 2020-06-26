import { h } from '@stencil/core'
import { Transaction } from 'stellar-sdk'

export default function TransactionSummary(tx: Transaction) {
  const opMessages = tx.operations.map((operation) => {
    switch (operation.type) {
      case 'allowTrust':
        return (
          <div>
            {`${operation.authorize ? 'Authorize' : 'Deauthorize'} ${
              operation.assetCode
            } access for ${operation.trustor.substr(0, 6)}`}
          </div>
        )
      case 'payment':
        return (
          <div>
            {`${(operation.source || tx.source).substr(0, 6)}
            pays ${operation.destination.substr(0, 6)} ${parseFloat(
              operation.amount
            ).toFixed(2)} ${operation.asset.code}`}
          </div>
        )
      default:
        return (
          <div>
            Unknown op type: <pre>${JSON.stringify(operation, null, 2)}</pre>
          </div>
        )
    }
  })

  return (
    <div class="popup-code-set code-set">
      <h3>Approve revised transaction from approval server?</h3>
      {opMessages}
    </div>
  )
}
