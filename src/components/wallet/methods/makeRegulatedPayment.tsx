import { h } from '@stencil/core'
import {
  TransactionBuilder,
  Transaction,
  Networks,
  Operation,
  Server,
  Asset,
  xdr,
} from 'stellar-sdk'
import TOML from 'toml'

import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { decrypt } from '@services/tweetnacl'

function makeTransactionSummary(tx: Transaction): HTMLElement {
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

  return <div class="popup-code-set code-set">{opMessages}</div>
}

export default async function makeRegulatedPayment(
  destination?: string,
  assetCode?: string,
  issuer?: string
) {
  try {
    const server = this.server as Server
    if (!destination)
      destination = await this.setPrompt({ message: 'Destination address' })

    if (!assetCode || (!issuer && assetCode !== 'XLM')) {
      const assetAndIssuer = await this.setPrompt({
        message: '{Asset} {Issuer} (leave empty for XLM)',
      })

      if (assetAndIssuer === '') assetCode = 'XLM'
      else [assetCode, issuer] = assetAndIssuer.split(' ')
    }

    const amount = await this.setPrompt({
      message: `How much ${assetCode} to pay?`,
    })

    const loadingKey = `sendRegulated:${assetCode}:${issuer}`
    this.loading = { ...this.loading, [loadingKey]: true }

    const pincode = await this.setPrompt({
      message: 'Enter your account pincode',
      type: 'password',
    })
    const pincode_stretched = await stretchPincode(
      pincode,
      this.account.publicKey
    )

    const keypair = decrypt(
      this.account.cipher,
      this.account.nonce,
      pincode_stretched
    )

    this.error = null

    const asset =
      assetCode === 'XLM' ? Asset.native() : new Asset(assetCode, issuer)
    const issuerAccount = await server.loadAccount(issuer)
    const homeDomain: string = (issuerAccount as any).home_domain
    const tomlURL = new URL(homeDomain)
    tomlURL.pathname = '/.well-known/stellar.toml'
    const tomlText = await fetch(tomlURL.toString()).then((r) => r.text())
    const toml = TOML.parse(tomlText)
    const tomlCurrency = toml.CURRENCIES.find((c) => c.code === assetCode)
    if (!tomlCurrency || !tomlCurrency.approval_server)
      throw 'No approval server for asset'
    const approvalServer = tomlCurrency.approval_server
    console.log('Found approval server: ' + approvalServer)

    const account = await server.loadAccount(keypair.publicKey())
    const transaction = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination,
          amount,
          asset,
        })
      )
      .setTimeout(30)
      .build()
    console.log('Built a transaction to request approval for:' + transaction)
    const approvalUrl = new URL(approvalServer)
    approvalUrl.searchParams.set('tx', transaction.toXDR())
    const json = await fetch(approvalUrl.toString()).then((resp) => resp.json())
    console.log(json)
    console.log('Response from approval server: ' + json.status)

    //@ts-ignore
    const revisedEnvelope = xdr.TransactionEnvelope.fromXDR(json.tx, 'base64')
    const revisedTx = new Transaction(revisedEnvelope, Networks.TESTNET)
    console.log(
      '<b>Revised Transaction from compliance server</b>' +
        makeTransactionSummary(revisedTx)
    )

    try {
      await this.popup({
        contents: makeTransactionSummary(revisedTx),
        confirmLabel: 'Confirm',
        cancelLabel: 'Reject',
      })
    } catch (e) {
      console.log('❌ Not signing the revised transaction, nothing happens')
      await this.popup({
        contents: (
          <div>❌ Not signing the revised transaction, nothing happens</div>
        ),
        confirmLabel: 'OK',
      })
      this.loading = { ...this.loading, [loadingKey]: false }
      return
    }
    const tx = new Transaction(revisedEnvelope, Networks.TESTNET)
    tx.sign(keypair)
    const labURL = `https://www.stellar.org/laboratory/#xdr-viewer?input=${encodeURIComponent(
      tx.toXDR()
    )}`
    console.log(
      `Submitting <a href="${labURL}" target="_blank">Signed Transaction (Open in stellar lab)</a>`
    )

    const { hash: txHash } = await server.submitTransaction(tx)
    console.log(
      `✅ Succesfully submitted regulated payment in transaction <a href="https://stellar.expert/explorer/testnet/tx/${txHash}" target="_blank">${txHash.substr(
        0,
        8
      )}</a>!`
    )

    this.loading = { ...this.loading, [loadingKey]: false }
    this.updateAccount()
  } catch (err) {
    this.error = handleError(err)
  }
}
