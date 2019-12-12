import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import { postcss } from '@stencil/postcss';
import autoprefixer from 'autoprefixer';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  namespace: 'stellar-demo-wallet',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader'
    },
    {
      type: 'docs-readme'
    },
    {
      type: 'www',
      serviceWorker: null // disable service workers
    }
  ],
  commonjs: {
    namedExports: {
      'stellar-sdk': ['Asset', 'Keypair', 'StrKey', 'Transaction'],
      'node_modules/@tinyanvil/wallet-sdk/dist/commonjs/wallet-sdk.js': ['DataProvider'],
      'node_modules/@tinyanvil/stellar-sdk/dist/stellar-sdk-common.min.js': ['Keypair'],
      'node_modules/@tinyanvil/stellar-base/dist/stellar-base-common.min.js': ['Keypair']
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
};