# Trustlines Clientlib

[![npm](https://img.shields.io/npm/v/trustlines-clientlib.svg)](https://www.npmjs.com/package/trustlines-clientlib)
[![CircleCI branch](https://img.shields.io/circleci/project/github/trustlines-protocol/clientlib/master.svg)](https://circleci.com/gh/trustlines-protocol/clientlib)
[![Codecov branch](https://img.shields.io/codecov/c/github/trustlines-protocol/clientlib/master.svg)](https://codecov.io/gh/trustlines-protocol/clientlib)

A TypeScript/JavaScript library for interacting with the [Trustlines Network Protocol](https://trustlines.network/).

## Installation

### Install via package manager

We publish the trustlines-clientlib to npm as a ES6 module.

#### Using npm

```bash
$ npm i trustlines-clientlib
```

#### Using yarn

```bash
$ yarn add trustlines-clientlib
```

### Build from source

If you want to build the library from source run

```bash
git clone git@github.com:trustlines-protocol/clientlib.git
cd clientlib
yarn && yarn build
```

This will create three different builds:

- ES6 module in `./lib-esm`
- CommonJS module in `./lib`
- Bundled JS injectable into browser in `./_bundles`

## Get started

We assume the usage of the `trustlines-clientlib` ES6 module in the following.

### Configuration

To start using the trustlines-clientlib you first have to configure the [relay server](https://github.com/trustlines-protocol/relay) you want to connect to.
You can either connect to a local develop relay server or use publicly available ones.

```javascript
import { TLNetwork } from 'trustlines-clientlib'

// Instance using a relay connected to the Laika Testnet
const laika = new TLNetwork({
  protocol: 'https',
  wsProtocol: 'wss',
  host: 'relay0.testnet.trustlines.network',
  path: '/api/v1'
  // ...
})

// Instance using a relay connected to the TLBC
const tlbc = new TLNetwork({
  protocol: 'https',
  wsProtocol: 'wss',
  host: '<url>', // TODO There is no public TLBC relay yet
  path: '/api/v1'
  // ...
})
```

### Example usage

This library is a promise-based library.
So every asynchronous call will return a native JavaScript promise.
If an error occurs the library will throw it.
The caller has to handle it appropriately.

```javascript
try {
  const networks = await laika.currencyNetwork.getAll()
} catch (error) {
  console.log('Caught error:', error)
}
```

### Read our [documentation]() for more

## Run Tests

```bash
# All tests
yarn test

# Unit tests
yarn test:unit

# Integration tests
yarn test:integration

# end2end tests
yarn test:e2e
```

### Note on end2end tests

You have to have all components of the trustlines protocol running.
A convenient way to achieve this is by using our [end2end](https://github.com/trustlines-protocol/end2end) setup.

## Running injected web3 example

To run the example make sure to have [MetaMask](https://metamask.io/) installed and connected to a JSON RPC.

```bash
yarn serve
```

This serves the injected web3 example app on `http://127.0.0.1:8080`. You can find the app under `./examples/injected-web3`.

## Change log

See [CHANGELOG](./CHANGELOG.md)
