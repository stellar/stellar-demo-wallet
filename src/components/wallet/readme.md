# stellar-wallet

<!-- Auto Generated Below -->


## Properties

| Property     | Attribute | Description | Type     | Default                                             |
| ------------ | --------- | ----------- | -------- | --------------------------------------------------- |
| `homeDomain` | --        |             | `String` | `'testanchor.stellar.org'`                          |
| `server`     | --        |             | `Server` | `new Server('https://horizon-testnet.stellar.org')` |
| `toml`       | --        |             | `Object` | `undefined`                                         |


## Dependencies

### Depends on

- [stellar-loader](../loader)
- [stellar-prompt](../prompt)

### Graph
```mermaid
graph TD;
  stellar-wallet --> stellar-loader
  stellar-wallet --> stellar-prompt
  style stellar-wallet fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
