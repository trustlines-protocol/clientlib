# Trustlines Clientlib

[![npm](https://img.shields.io/npm/v/trustlines-clientlib.svg)](https://www.npmjs.com/package/trustlines-clientlib)
[![CircleCI branch](https://img.shields.io/circleci/project/github/trustlines-protocol/clientlib/master.svg)](https://circleci.com/gh/trustlines-protocol/clientlib)
[![Codecov branch](https://img.shields.io/codecov/c/github/trustlines-protocol/clientlib/master.svg)](https://codecov.io/gh/trustlines-protocol/clientlib)
[![gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/trustlines/community)

The clientlib is a component of the [Trustlines Protocol](https://trustlines.foundation/protocol.html).
The Trustlines Protocol is a set of rules to allow the transfer of value on top of existing trust
relationships stored on a trustless infrastructure, here a blockchain.

In the technology stack, the clientlib is located on top of a [relay server](https://github.com/trustlines-protocol/relay),
and a mobile application can be built on top of it.

The goal of the clientlib is to provide a user focused means to interact with Trustlines via a relay server.
It also provides a means to handle the wallet and key for the user.
The intent is to make it as easy as possible to build a user interface for Trustlines on top of it.

## Get Up and Running

The trustlines-clientlib is published to npm as an ES6 module.
You can install it using either `npm` or `yarn`.

#### Using npm

```bash
$ npm i trustlines-clientlib
```

#### Using yarn

```bash
$ yarn add trustlines-clientlib
```

#### Build from source

If you want to build the library from source, you can run:

```bash
git clone git@github.com:trustlines-protocol/clientlib.git
cd clientlib
yarn && yarn build
```

This will create three different builds:

- ES6 module in `./lib-esm`
- CommonJS module in `./lib`
- Bundled JS injectable into browser in `./_bundles`

#### Example

We assume the usage of the `trustlines-clientlib` ES6 module in the following.

To start using the trustlines-clientlib you first have to configure the [relay server](https://github.com/trustlines-protocol/relay)
you want to connect to. You can either connect to a local develop relay server or use publicly available ones.

```javascript
import { TLNetwork } from 'trustlines-clientlib'

// Instance using a relay connected to the Laika Testnet
const laika = new TLNetwork({
  relayUrl: {
    protocol: 'https',
    port: '80',
    host: 'relay0.testnet.trustlines.network',
    path: '/api/v1'
  },
  messagingUrl: {
    protocol: 'https',
    port: '80',
    host: 'relay0.testnet.trustlines.network',
    path: '/api/v1'
  }

  // ...
})

// Instance using a relay connected to the TLBC
const tlbc = new TLNetwork({
  relayUrl: 'https://tlbc.relay.anyblock.tools/api/v1',
  messagingUrl: 'https://messaging.trustlines.app/api/v1'
  // ...
})
```

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

## Start developing

If you want to start developing on the clientlib, make sure you can run the tests:

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

The end2end tests are used to test how different components of the Trustlines protocol run together.
You need to have all components up before running them.
A convenient way to achieve this is by using our [end2end](https://github.com/trustlines-protocol/end2end) setup.

## Contributing

Contributions are highly appreciated, but please check our [contributing guidelines](CONTRIBUTING.md).

## Release

To release a new version simply run:

```
yarn bump [patch|minor|major]
```

This will update the version in the `package.json` file, add a git tag with the updated version to the current commit and eventually push to github.
Subsequently, CircleCI will publish the tagged version to npm.
Make sure to update the changelog accordingly.

Note that we also fluidly publish the most recent commit on the `master` branch using [fluid-publish](https://github.com/fluid-project/fluid-publish).

## Change log

See [CHANGELOG](./CHANGELOG.md)

## Documentation

To generate the [typedoc](https://typedoc.org/) API reference documentation for this library run `yarn doc`.
This will generate output in the `docs` folder.
