import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'
import { postcss } from '@stencil/postcss'
import autoprefixer from 'autoprefixer'
import nodePolyfills from 'rollup-plugin-node-polyfills'

export const config: Config = {
  namespace: 'stellar-wallet',
  devServer: {
    openBrowser: false,
  },
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
      baseUrl:
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:3333/'
          : 'https://stellar-demo-wallet.now.sh/',
    },
  ],
  globalStyle: 'src/global/style.scss',
  rollupPlugins: {
    after: [nodePolyfills()],
  },
  plugins: [
    sass(),
    postcss({
      plugins: [autoprefixer()],
    }),
  ],
  nodeResolve: {
    browser: true,
    preferBuiltins: true,
  },
  testing: {
    transformIgnorePatterns: ['<rootDir>/node_modules/(?!lodash-es)'],
    transform: {
      '^.+\\.(js|jsx)$': 'ts-jest',
    },
    moduleNameMapper: {
      '^@services/(.*)$': '<rootDir>/src/services/$1',
      '^@prompt/(.*)$': '<rootDir>/src/components/prompt/$1',
    },
  },
  hashFileNames: process.env.NODE_ENV !== 'development',
}
