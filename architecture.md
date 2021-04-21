# Architecture

This document describes the high-level architecture and file structure of the
Demo Wallet.

## Tech stack

- [TypeScript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/) for UI
- [React Router](https://reactrouter.com/web/guides/quick-start) for routing
- [Sass](https://sass-lang.com/) for CSS styling
- [Stellar Design System](https://github.com/stellar/stellar-design-system) for
  re-usable components and styles
- [Redux Toolkit](https://redux-toolkit.js.org/) for global state management
- [Yarn](https://yarnpkg.com/) for package management

## File structure

### `index.tsx`

Root file of the project

### `App.tsx`

Top level file/entry point of the app

### `App.scss`

Global file of styles

### `/assets`

Images and SVGs (icons)

### `/components`

Building blocks of the UI. Larger components go into their own directory.

If a component requires its own styles (and it doesn't belong in the global
`App.scss` file), it will have its own directory also.

Re-usable components and styles will come from the Stellar Design System.

### `/config`

App configuration. Redux store root lives there (`store.ts`).

### `/constants`

For various constants used in the app

### `/ducks`

Every file in the `/ducks` directory is a reducer in the Redux state (must be
added to the root `config/store.ts`). Inside every reducer are dispatch actions
to update the state (we follow Redux Toolkit conventions).

![Red banner: You are using PUBLIC network in DEVELOPMENT](public/images/doc-redux-state.png)
_Redux state illustration_

### `/helpers`

Smaller, more generic helper functions

### `/hooks`

Custom hooks

### `/methods`

Methods are more specific than helper functions. SEPs go into their own
directory (for example, `sep10Auth/`, `sep31Send/`).

### `/pages`

Higher level components that match the route (for example, `Landing.tsx`,
`Account.tsx`)

### `/types`

TypeScript types
