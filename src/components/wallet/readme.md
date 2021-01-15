# stellar-wallet

<!-- Auto Generated Below -->


## Properties

| Property             | Attribute            | Description | Type      | Default                                             |
| -------------------- | -------------------- | ----------- | --------- | --------------------------------------------------- |
| `logger`             | --                   |             | `ILogger` | `MockLogger`                                        |
| `network_passphrase` | `network_passphrase` |             | `string`  | `Networks.TESTNET`                                  |
| `server`             | --                   |             | `Server`  | `new Server('https://horizon-testnet.stellar.org')` |


## Dependencies

### Depends on

- [stellar-prompt](../prompt)
- [stellar-loader](../loader)
- [collapsible-container](views)

### Graph
```mermaid
graph TD;
  stellar-wallet --> stellar-prompt
  stellar-wallet --> stellar-loader
  stellar-wallet --> collapsible-container
  style stellar-wallet fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
