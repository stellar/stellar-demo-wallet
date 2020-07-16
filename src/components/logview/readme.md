# log-view



<!-- Auto Generated Below -->


## Methods

### `error(title: string, body?: string) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `instruction(title: string, body?: string) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `request(url: string, body?: string | object) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `response(url: string, body?: string | object) => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [json-viewer](../jsonviewer)

### Graph
```mermaid
graph TD;
  log-view --> json-viewer
  json-viewer --> json-viewer
  style log-view fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
