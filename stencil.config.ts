import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'
import { postcss } from '@stencil/postcss'
import autoprefixer from 'autoprefixer'
import nodePolyfills from 'rollup-plugin-node-polyfills'

export const config: Config = {
  devServer: {
    openBrowser: false
  },
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
      baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:3333/' : 'https://stellar-demo-wallet.now.sh/'
    }
  ],
  globalStyle: 'src/global/style.scss',
  commonjs: {
    namedExports: {
      'stellar-sdk': ['StrKey', 'xdr', 'Transaction', 'Keypair', 'Networks', 'Account', 'TransactionBuilder', 'BASE_FEE', 'Operation', 'Asset', 'Memo', 'MemoHash']
    },
  },
  plugins: [
    nodePolyfills(),
    sass(),
    postcss({
      plugins: [autoprefixer()]
    })
  ],
  nodeResolve: {
    browser: true,
    preferBuiltins: true
  }
}