# stellar-wallet

<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description | Type     | Default                                             |
| ------------ | ------------- | ----------- | -------- | --------------------------------------------------- |
| `homeDomain` | `home-domain` |             | `string` | `'testanchor.stellar.org'`                          |
| `server`     | --            |             | `Server` | `new Server('https://horizon-testnet.stellar.org')` |
| `toml`       | `toml`        |             | `any`    | `undefined`                                         |


## Dependencies

### Depends on

- [stellar-prompt](../prompt)
- [collapsible-container](views)
- [log-view](../logview)
- [stellar-loader](../loader)

### Graph
```mermaid
graph TD;
  stellar-wallet --> stellar-prompt
  stellar-wallet --> collapsible-container
  stellar-wallet --> log-view
  stellar-wallet --> stellar-loader
  style stellar-wallet fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
