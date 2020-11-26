import { newSpecPage } from '@stencil/core/testing'
import { Component } from '@stencil/core'
import balanceDisplay from './balanceDisplay'
import { Wallet } from '../wallet'

/* Create a temporal component to be able to test balanceDisplay in
 * isolation since it is build as a helper If you want to test the whole
 * component then you could follow the guide here
 * https://stenciljs.com/docs/unit-testing*/
@Component({
  tag: 'balance-display',
})
class BalanceDisplay {
  render() {
    /* set the wallet with whatever data you want to test, in this
     * scenario since we want to test how the balanceDisplay helper
     * behaves, we are going to create a new wallet and then mock the
     * state, which expects an AccountResponse from Horizon*/
    const wallet = new Wallet()
    wallet.account = {
      state: {
        id: 'GAHZQHEQW2R6UIHHYQDTTSCGHR2HUYVGW26IQUAFTJICLECERUV2NDYB',
        balances: [
          {
            balance: '2018000.0000000',
            limit: '900000000000.0000000',
            buying_liabilities: '0.0000000',
            selling_liabilities: '0.0000000',
            last_modified_ledger: 200836,
            is_authorized: true,
            is_authorized_to_maintain_liabilities: true,
            asset_type: 'credit_alphanum12',
            asset_code: 'USDC',
            asset_issuer:
              'GCY3FGKMBKOVVFN2MQXGZAVJ7HJH6KFIQMZ4EORXLFGWWKBEYXUNRNBI',
          },
          {
            balance: '9960.1381500',
            buying_liabilities: '0.0000000',
            selling_liabilities: '0.0000000',
            asset_type: 'native',
          },
        ],
      },
    }

    // in the test we want to check that both balances are render and that they contain the expected values
    return [balanceDisplay.call(wallet)]
  }
}

it('should render my component', async () => {
  const page = await newSpecPage({
    components: [BalanceDisplay],
    html: `<balance-display></balance-display>`,
  })

  /* btw a better way to test this would be to use jest snapshots! But
   * that's left out as an exercise to the reader ;)*/
  expect(page.root).toEqualHtml(`
    <balance-display>
      <div><pre class="account-state"><h2 class="balance-headers">Balances</h2><div class="asset-row"><div class="balance-row"><div class="asset-code">USDC:</div><div class="balance">2018000.0000000</div></div><div class="actions"><button>Send</button><button>Deposit</button><button>Withdraw</button></div></div><div class="asset-row"><div class="balance-row"><div class="asset-code">XLM:</div><div class="balance">9960.1381500</div></div><div class="actions"><button>Send</button></div></div></pre>
   </balance-display>
  `)

  /* Also since we really want is to unit test we can be more granular
   * that the previous test `page` is a DOM mock, so we can use some
   * helper to ask better questions (see
   * https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll),
   * like for example, instead of comparing the whole DOM, we want to
   * assert that there are 2 divs with the class `balance-row`*/
  const balanceRows = page.body.querySelectorAll('.balance-row')
  expect(balanceRows).toHaveLength(2)

  // now let's assert that the first one is USDC and the second one native

  const [usdc, native] = balanceRows

  expect(usdc.textContent).toEqual('USDC:2018000.0000000')
  expect(native.textContent).toEqual('XLM:9960.1381500')
})
