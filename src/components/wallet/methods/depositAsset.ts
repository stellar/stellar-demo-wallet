import sjcl from '@tinyanvil/sjcl'
import {
  Transaction,
  Keypair,
} from 'stellar-sdk'
import axios from 'axios'
import {
  get as loGet,
  each as loEach,
  findIndex as loFindIndex,
} from 'lodash-es'

import { handleError } from '@services/error'

export default async function depositAsset(
  e?: Event
) {
  try {
    if (e) e.preventDefault()

    let currency = await this.setPrompt('Select the currency you\'d like to deposit', null, this.toml.CURRENCIES)
        currency = currency.split(':')

    const pincode = await this.setPrompt('Enter your keystore pincode')

    if (!pincode)
        return

    const balances = loGet(this.account, 'state.balances')
    const hasCurrency = loFindIndex(balances, {
      asset_code: currency[0],
      asset_issuer: currency[1]
    })

    if (hasCurrency === -1)
      await this.trustAsset(null, currency[0], currency[1], pincode)

    const info = await axios.get(`${this.toml.TRANSFER_SERVER}info`)
    .then(({data}) => data)

    console.log(info)

    const auth = await axios.get(`${this.toml.WEB_AUTH_ENDPOINT}`, {
      params: {
        account: this.account.publicKey
      }
    })
    .then(async ({data}) => {
      const transaction: any = new Transaction(data.transaction, data.network_passphrase)

      this.error = null
      this.loading = {...this.loading, deposit: true}

      const keypair = Keypair.fromSecret(
        sjcl.decrypt(pincode, this.account.keystore)
      )

      transaction.sign(keypair)
      return transaction.toXDR()
    })
    .then((transaction) => axios.post(`${this.toml.WEB_AUTH_ENDPOINT}`, {transaction}, {headers: {'Content-Type': 'application/json'}}))
    .then(({data: {token}}) => token) // Store the JWT in localStorage

    console.log(auth)

    const formData = new FormData()

    loEach({
      asset_code: currency[0],
      account: this.account.publicKey,
      lang: 'en'
    }, (value, key) => formData.append(key, value))

    const interactive = await axios.post(`${this.toml.TRANSFER_SERVER}transactions/deposit/interactive`, formData, {
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'multipart/form-data'
      }
    }).then(({data}) => data)

    console.log(interactive)

    const transactions = await axios.get(`${this.toml.TRANSFER_SERVER}transactions`, {
      params: {
        asset_code: currency[0],
        limit: 1,
        kind: 'deposit',
      },
      headers: {
        'Authorization': `Bearer ${auth}`
      }
    })
    .then(({data: {transactions}}) => transactions)

    console.log(transactions)

    const urlBuilder = new URL(interactive.url)
          urlBuilder.searchParams.set('jwt', auth)
    const popup = window.open(urlBuilder.toString(), 'popup', 'width=500,height=800')

    if (!popup) {
      this.loading = {...this.loading, deposit: false}
      throw 'Popups are blocked. You\'ll need to enable popups for this demo to work'
    }

    await new Promise((resolve, reject) => {
      let intervaled = 0

      const interval = setInterval(() => {
        axios.get(`${this.toml.TRANSFER_SERVER}transaction`, {
          params: {
            id: transactions[0].id
          },
          headers: {
            'Authorization': `Bearer ${auth}`
          }
        }).then(({data: {transaction}}) => {
          console.log(transaction.status, transaction)

          if (intervaled >= 60)
            throw 'Withdraw flow timed out. Please reload and try again'

          else if (transaction.status === 'completed') {
            this.updateAccount()
            this.loading = {...this.loading, deposit: false}

            const urlBuilder = new URL(transaction.more_info_url)
                  urlBuilder.searchParams.set('jwt', auth)

            popup.location.replace(urlBuilder.toString())

            clearInterval(interval)
            resolve()
          }

          intervaled++
        })
        .catch((err) => {
          clearInterval(interval)
          reject(err)
        })
      }, 1000)
    })
  }

  catch (err) {
    this.loading = {...this.loading, deposit: false}
    this.error = handleError(err)
  }
}