# trustlines-network clientlib
A TypeScript/Javascript library for interacting with the [trustlines-network protocol](https://trustlines.network/).

## Read the [Documentation](https://trustlines-network.github.io/clientlib-docs/)

## Installation
The project is currently not published on npm but will soon be. Until then clone or download the repository from [here](https://github.com/trustlines-network/clientlib) and follow the steps below.

Change into directory
```
$ cd ./clientlib
```
Install dependencies with `npm` or `yarn`
```
$ npm/yarn install
```
Build sources in case your project is not a TypeScript project
```
$ npm/yarn build
```
The command above will create three different sources which you can use depending on your project structure
```
_bundles/		// UMD bundles
lib/			// ES5(commonjs) + source + .d.ts
lib-esm/		// ES5(esmodule) + source + .d.ts
```
#### Import UMD bundle in HTML
```html
<script src="./_bundles/trustlines-network.js"></script>
```
#### Import CommonJS module
```javascript
const TLNetwork = require('./lib/TLNetwork.js')
```
#### Import ES6 module
```javascript
import { TLNetwork } from './lib-esm/trustlines-network'
```

Use the following configuration to connect to the currently deployed test setup.


**NOTE: The [trustlines-network contracts](https://github.com/trustlines-network/contracts) are deployed on the Kovan testnet. Some Kovan Test ETH is therefore required to interact with the contracts in this setup.**


```javascript
import { TLNetwork } from './src/TLNetwork'

const config = {
  protocol: 'https',
  host: 'relay0.testnet.trustlines.network',
  path: 'api/v1/'
}

const tlNetwork = new TLNetwork(config)
```

## Example
This library is a promise-based library. So every asynchronous call will return a native Javascript promise. If an error occurs the library will throw it. The caller has to handle it appropriately.

```javascript
try {
  const networks = await tlNetwork.currencyNetwokr.getAll()
}
catch (error) {
  console.log('Caught error:', error)
}
```
