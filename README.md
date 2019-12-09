# trustlines-network clientlib

[![npm](https://img.shields.io/npm/v/trustlines-clientlib.svg)](https://www.npmjs.com/package/trustlines-clientlib)
[![CircleCI branch](https://img.shields.io/circleci/project/github/trustlines-protocol/clientlib/master.svg)](https://circleci.com/gh/trustlines-protocol/clientlib)
[![Codecov branch](https://img.shields.io/codecov/c/github/trustlines-protocol/clientlib/master.svg)](https://codecov.io/gh/trustlines-protocol/clientlib)

A TypeScript/Javascript library for interacting with the [trustlines-network protocol](https://trustlines.network/).

## Read the [Documentation](https://docs.trustlines.network/)

## Installation

Install the library using `npm` or `yarn`

```bash
$ npm install trustlines-clientlib
// OR
$ yarn add trustlines-clientlib
```

#### Import ES6 module

```javascript
import { TLNetwork } from 'trustlines-clientlib'
```

Use the following configuration to connect to the currently deployed test setup.

**NOTE: The [trustlines-network contracts](https://github.com/trustlines-network/contracts) are deployed on the Laika Testnet ([Laika Blockexplorer](https://explore.laika.trustlines.foundation/)), the test network of Trustlines. Some Laika test `TLC` is therefore required to interact with the contracts in this setup.**

```javascript
import { TLNetwork } from 'trustlines-clientlib'

const tlNetworkConfig = {
  protocol: 'https',
  host: 'relay0.testnet.trustlines.network',
  path: 'api/v1/'
}

const tlNetwork = new TLNetwork(tlNetworkConfig)
```

## Example

This library is a promise-based library. So every asynchronous call will return a native Javascript promise. If an error occurs the library will throw it. The caller has to handle it appropriately.

```javascript
try {
  const networks = await tlNetwork.currencyNetwokr.getAll()
} catch (error) {
  console.log('Caught error:', error)
}
```

## Running injected web3 example

To run the example make sure to have [MetaMask](https://metamask.io/) installed and connected to a JSON RPC.

```bash
yarn serve
```

This serves the injected web3 example app on `http://127.0.0.1:8080`. You can find the app under `./examples/injected-web3`.
