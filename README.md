# trustlines-network clientlib

[![npm](https://img.shields.io/npm/v/trustlines-clientlib.svg)](https://www.npmjs.com/package/trustlines-clientlib)
[![Travis (.org) branch](https://img.shields.io/travis/trustlines-network/clientlib/develop.svg)](https://travis-ci.org/trustlines-network/clientlib)
[![Codecov branch](https://img.shields.io/codecov/c/github/trustlines-network/clientlib/develop.svg)](https://codecov.io/gh/trustlines-network/clientlib)

A TypeScript/Javascript library for interacting with the [trustlines-network protocol](https://trustlines.network/).

## Read the [Documentation](https://trustlines-network.github.io/clientlib-docs/)

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

**NOTE: The [trustlines-network contracts](https://github.com/trustlines-network/contracts) are deployed on the Kovan testnet. Some Kovan Test ETH is therefore required to interact with the contracts in this setup.**

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
