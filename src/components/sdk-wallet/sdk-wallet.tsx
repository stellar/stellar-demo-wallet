import { Component, Host, h } from '@stencil/core'
import { DataProvider } from '@tinyanvil/stellar-wallet-sdk--built'

@Component({
  tag: 'stellar-sdk-wallet',
  styleUrl: 'sdk-wallet.scss',
  shadow: true
})
export class SdkWallet {
  async componentWillLoad() {
    // You'll use your DataProvider instance to ask for data from Stellar.
    const dataProvider = new DataProvider({
      serverUrl: 'https://horizon-testnet.stellar.org',
      accountOrKey: 'GDTXHCGMZDMHNN2BTSGOVVDAKIEUFSQPB7OLNMTRFUTSOV6KTWR2N75R',
    })
     
    // Some class functions will fetch data directly.
    const offers = await dataProvider.fetchOpenOffers({
      limit: 20,
      order: 'desc',
    })

    console.log(offers)
     
    // Others will watch the network for changes and invoke callback when it happens.
    dataProvider.watchAccountDetails({
      onMessage: (accountDetails) => {
        console.log('Latest account details: ', accountDetails);
      },
      onError: (err) => {
        console.log('error: ', err);
      },
    });
  }

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

}
