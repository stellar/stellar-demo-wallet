import { Config } from "@stencil/core";
import { sass } from "@stencil/sass";
import { postcss } from "@stencil/postcss";
import autoprefixer from "autoprefixer";
import nodePolyfills from "rollup-plugin-node-polyfills";

export const config: Config = {
  namespace: "stellar-wallet",
  devServer: {
    openBrowser: false,
  },
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
    },
    {
      type: "docs-readme",
    },
    {
      type: "www",
      serviceWorker: null, // disable service workers
      baseUrl:
        process.env.NODE_ENV === "development"
          ? "http://localhost:3333/"
          : "https://stellar-demo-wallet.now.sh/",
    },
  ],
  globalStyle: "src/global/style.scss",
  commonjs: {
    namedExports: {
      "stellar-sdk": [
        "StrKey",
        "xdr",
        "Transaction",
        "Keypair",
        "Networks",
        "Account",
        "TransactionBuilder",
        "BASE_FEE",
        "Operation",
        "Asset",
        "Memo",
        "MemoHash",
      ],
    },
  },
  plugins: [
    nodePolyfills(),
    sass(),
    postcss({
      plugins: [autoprefixer()],
    }),
  ],
  nodeResolve: {
    browser: true,
    preferBuiltins: true,
  },
};
