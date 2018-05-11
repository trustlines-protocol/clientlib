# trustlines-network clientlib

## About
This is the JS library of the trustlines network project. It is currently not published on npm but will soon be. Until then clone or download this repository and follow the guide below.

## Get started
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
Import UMD bundle in HTML
```html
<html>
  <body>
    <script src="./_bundles/trustlines-network.min.js"></script>
  </body>
</html>
```
Import CommonJS module
```javascript
const TLNetwork = require('./lib/TLNetwork.js')
```
Import ES6 module
```javascript
import { TLNetwork } from './lib-esm/trustlines-network'
```

## Initialization
Use the following configuration to connect to the currently deployed test setup.
**NOTE: The smart contracts are deployed on the Kovan testnet. So some Kovan Test ETH is required to interact with the contracts in this setup.**
```javascript
import { TLNetwork } from './src/TLNetwork'

const config = {
  protocol: 'http',
  host: 'relay0.testnet.trustlines.network',
  port: 443,
  path: 'api/v1/'
}

const tlNetwork = new TLNetwork(config)
```

## User

### Create new user
`TLNetwork.user.create()`

#### Returns
`Promise<Object>`
- `address` - address of externally owned account
- `pubKey` - public key
- `keystore` - serialized [eth-lightwallet]() keystore object `IMPORTANT: has to be stored locally on client`

#### Example
```javascript
tlNetwork.user.create().then(newUser => {
  console.log('New user created: ', newUser)
})
```

### Load existing user
`TLNetwork.user.load(serializedKeystore)`

#### Parameters
- `serializedKeystore` - stringified [eth-lightwallet]() key store object

#### Returns
`Promise<Object>`
- `address` - address of externally owned account
- `pubKey` - public key of user
- `proxyAddress` - address of proxy contract
- `keystore` - serialized [eth-lightwallet]() keystore object

#### Example
```javascript
const keystore = '{"encSeed":{"encStr":"fdlM/t...,[...],"nonce":"mWCUhPdymK4VrR52a2ZHSibjXZcuclSh"},"salt":"njcNILd2XXQpF9ki4YzSiAfVPUzQu89WKlkI7F4/eXA=","version":2}'

tlNetwork.user.load(keystore).then(loadedUser => {
    console.log('Existing user loaded: ', loadedUser)
})
```

### Create onboarding message
`TLNetwork.user.createOnboardingMsg(username, keystore)`

Called from a new user who wants to *get onboarded*

#### Parameters
- `username` - name of user who wants to get onboarded
- `keystore` - serialized [eth-lightwallet]() keystore object

#### Returns
`Promise<string>`
- `http://trustlines.network/v1/:username/:adress/:pubKey`
- `username` - name of new user who wants to get onboarded
- `address` - ethereum address of new user
- `pubKey` - public key of new user to encrypt messages

### Prepare onboarding
`TLNetwork.user.prepOnboarding(newUserAddress)`

Called from a user who *onboards* another user to *prepare* transactions for relay

#### Parameters
- `newUserAddress` - address of new user who wants to get onboarded

#### Returns
`Promise<Object>`
- `proxyTx` - tx object of proxy contract creation
- `proxyTx.rawTx` - hex string of proxy contract creation transaction
- `proxyTx.ethFees` - eth transaction fees
- `valueTx` - tx object of onboarding eth transfer transaction
- `valueTx.rawTx` - hex string of eth transfer transaction
- `valueTx.ethFees` - eth transaction fees

### Confirm onboarding
`TLNetwork.user.confirmOnboarding(rawProxyTx, rawValueTx)`

Called from an user who *onboards* another user

#### Parameters
- `rawProxyTx` - hex string of proxy contract creation transaction
- `rawValueTx` - hex string of eth transfer transaction

#### Returns
`Promise<Object>`
- `proxyTxId` - id of proxy contract creation transaction
- `valueTxId` - id of eth transfer transaction

### Recover user from seed
`TLNetwork.user.recoverFromSeed(seed)`

#### Parameters
- `seed` - 12 word seed string

#### Returns
`Promise<Object>`
- `address` - address of recovered externally owned account
- `pubKey` - public key of recovered user
- `proxyAddress` - address of proxy contract
- `keystore` - serialized [eth-lightwallet]() keystore object

### Reveal seed words
`TLNetwork.user.showSeed()`

#### Returns
`Promise<string>` - 12 word seed string

## Currency Network

### Get all registered currency networks
`TLNetwork.currencyNetwork.getAll()`

#### Returns
`Promise<object[]>`
- `address` - address of currency network
- `name` - name of currency network
- `abbreviation` - abbreviation of currency (i.e. EUR, USD)

#### Example
```javascript
tlNetwork.currencyNetwork.getAll().then(networks => {
    console.log('All registered networks: ', networks)
})
```

### Get detailed information of currency network
`TLNetwork.currencyNetwork.getInfo(networkAddress)`

#### Parameters
- `networkAddress` - address of currency network

#### Returns
`Promise<object>`
- `address` - address of currency network
- `name` - name of currency network
- `abbreviation` - abbreviation of currency (i.e. EUR, USD)
- `numUsers` - number of users in currency network

#### Example
```javascript
tlNetwork.currencyNetwork.getInfo('0xabc123bb...').then(network => {
  console.log('Detailed network information: ', network)
})
```

### Get all proxy addresses of users in currency network
`TLNetwork.currencyNetwork.getUsers(networkAddress)`

#### Parameters
- `networkAddress` - address of currency network

#### Returns
`Promise<string[]>`
- `string` - proxy addresses of users in a currency network

#### Example
```javascript
tlNetwork.currencyNetwork.getUsers('0xabc123bb...').then(addresses => {
    console.log('Proxy addresses of users in network 0xabc123bb...', addresses )
})
```

### Get overview of currency network in user context
`TLNetwork.currencyNetwork.getUserOverview(networkAddress, userAddress)`

#### Parameters
- `networkAddress` - address of currency network
- `userAddress` - address of user

#### Returns
`Promise<object>`
- `balance` - sum over balances of all trustlines user has in currency network
- `given` - sum of all credit lines given by user in currency network
- `received` - sum of all credit lines received by user in currency network
- `leftGiven` - given - balance
- `leftReceived` - received + balance

#### Example
```javascript
tlNetwork.currencyNetwork.getUserOverview('0xabc123bb...', '0xb33f33...').then(overview => {
    console.log('Overview for user 0xb33f33... in currency network 0xabc123bb...', overview)
})
```

### Get contacts of user
Returns a list of addresses a user has trustlines with

`TLNetwork.contact.getAll(networkAddress)`

#### Parameters
- `networkAddress` - address of currency network

#### Returns
`Array<string[]>` - addresses of contacts

## Trustline

### Get trustlines of user in currency network
`TLNetwork.trustline.getAll(networkAddress)`

#### Parameters
- `networkAddress` - address of currency network

#### Returns
`Promise<object[]>`
- `address` - address of counterparty
- `balance` - balance of trustline from view of requestor
- `given` - credit line given by requestor
- `leftGiven` - given - balance
- `received` - credit line received
- `leftReceived` - received + balance
- `interestRate` - interest rate of trustline // TODO

#### Example
```javascript
tlNetwork.trustline.getAll('0xabc123bb...').then(trustlines => {
    console.log('Trustlines of loaded user in currency network 0xabc123bb...: ', trustlines)
})
```

### Get specific trustline
`TLNetwork.trustline.get(networkAddress, userAddress)`

#### Parameters
- `networkAddress` - address of currency network
- `userAddress` - address of counterparty

#### Returns
`Promise<object>`
- `address` - address of counterparty
- `balance` - balance of trustline from view of requestor
- `given` - credit line given by requestor
- `leftGiven` - given - balance
- `received` - credit line received
- `leftReceived` - received + balance
- `interestRate` - interest rate of trustline // TODO

#### Example
```javascript
tlNetwork.trustline.get('0xccccc...', '0xbbbbbb...').then(trustline => {
    console.log('Trustline of loaded user in currency network 0xccccc... to user 0xbbbbb...: ', trustline)
})
```

### Get trustline requests
`TLNetwork.trustline.getRequests(networkAddress, filter)`

#### Parameters
- `networkAddress` - address of currency network
- `filter` (optional) - { fromBlock: number, toBlock: number }

#### Returns
`Promise<object[]>`
- `blockNumber` - number of block
- `address` - proxy address of counterparty
- `amount` - amount of proposed creditline
- `direction` - `sent` or `received`
- `networkAddress` - address of currency network
- `status` - `sent` | `pending` | `confirmed`
- `timestamp` - unix timestamp
- `transactionId` - transaction hash of event
- `type` - `CreditlineUpdateRequest`

#### Example
```javascript
const filter = { fromBlock: 1, toBlock: 10 }
tlNetwork.trustline.getRequests('0xabc123bb...', filter).then(requests => {
    console.log('Trustline requests: ', requests)
})
```

### Get trustline updates
`TLNetwork.trustline.getUpdates(networkAddress, filter)`

#### Parameters
- `networkAddress` - address of currency network
- `filter` (optional) - { fromBlock: number, toBlock: number }

#### Returns
`Promise<object[]>`
- `blockNumber` - number of block
- `address` - proxy address of counterparty
- `amount` - amount of proposed creditline
- `direction` - `sent` or `received`
- `networkAddress` - address of currency network
- `status` - `sent` | `pending` | `confirmed`
- `timestamp` - unix timestamp
- `transactionId` - transaction hash of event
- `type` - `CreditlineUpdate`

#### Example
```javascript
const filter = { fromBlock: 1, toBlock: 10 }
tlNetwork.trustline.getUpdates('0xabc123bb...', filter).then(updates => {
    console.log('Trustline updates: ', updates)
})
```

### Prepare trustline update
`TLNetwork.trustline.prepareUpdate(network, debtor, value)`

#### Parameters
- `network` - address of currency network
- `debtor` - proxy address of debtor
- `value` - new value credit line

#### Returns
`Promise<object>`
- `ethFees` - estimated ETH transaction fees
- `rawTx` - RLP-encoded hex string defining the transaction

### Prepare trustline accept
`TLNetwork.trustline.prepareAccept(network, creditor)`

#### Parameters
- `network` - address of currency network
- `creditor` - proxy address of creditor

#### Returns
`Promise<object>`
- `ethFees` - estimated ETH transaction fees
- `rawTx` - RLP-encoded hex string defining the transaction

### Confirm trustline accept/update
`TLNetwork.trustline.confirm(rawTx)`

#### Parameters
- `rawTx` - RLP-encoded hex string defining the transaction

#### Returns
`Promise<object>`
- `txId` - transaction hash

## Payment

### Get transfers
`TLNetwork.payment.get(networkAddress, filter)`

#### Parameters
- `networkAddress` - address of currency network
- `filter` (optional) - { fromBlock: number, toBlock: number }

`Promise<object[]>`
- `blockNumber` - number of block
- `address` - proxy address of counterparty
- `amount` - amount of proposed creditline
- `direction` - `sent` or `received`
- `networkAddress` - address of currency network
- `status` - `sent` | `pending` | `confirmed`
- `timestamp` - unix timestamp
- `transactionId` - transaction hash of event
- `type` - `Transfer`

#### Example
```javascript
const filter = { fromBlock: 1, toBlock: 10 }
tlNetwork.payment.get('0xabc123bb...', filter).then(transfers => {
    console.log('Trustline transfers: ', transfers)
})
```

### Prepare transfer
`TLNetwork.payment.prepare(network, receiver, value)`

#### Parameters
- `network` - address of currency network
- `receiver` - proxy address of receiver
- `value` - amount to transfer

#### Returns
`Promise<object>`
- `ethFees` - estimated ETH transaction fees
- `path` - path for transfer
- `tlFees` - estimated TL fees for transfer
- `rawTx` - RLP-encoded hex string defining the transaction

### Confirm prepared transfer
`TLNetwork.payment.confirm(rawTx)`

#### Parameters
- `rawTx` - RLP-encoded hex string defining the transaction

#### Returns
`Promise<object>`
- `txId` - transaction hash

## Events

### Get events
`TLNetwork.event.get(network, filter)`

#### Parameters
- `network` - address of currency network
- `filter` (optional) - { type, fromBlock, toBlock }

#### Returns
`Promise<object[]>`
- `blockNumber` - number of block
- `address` - proxy address of counterparty
- `amount` - amount of proposed creditline
- `direction` - `sent` or `received`
- `networkAddress` - address of currency network
- `status` - `sent` | `pending` | `confirmed`
- `timestamp` - unix timestamp
- `transactionId` - transaction hash of event
- `type` - `CreditlineUpdateRequest` | `CreditlineUpdate` | `Transfer` | `ChequeCashed`

### Create event Observable
`TLNetwork.event.createObservable(network, filter)`

#### Parameters
- `network` - address of currency network
- `filter` (optional) - { type, fromBlock, toBlock }

#### Returns
`Observable`

#### Example
```javascript
const subscription = tlNetwork.createObservable('0xb33f33...').subscribe(events => console.log('Events: ', events))

// to unsubscribe from Observable
subscription.unsubscribe()
```

## Compiling and building
Compiling and bundling follows this setup: http://marcobotto.com/compiling-and-bundling-typescript-libraries-with-webpack/

### Library structure
```
_bundles/       // UMD bundles
lib/            // ES5(commonjs) + source + .d.ts
lib-esm/        // ES5(esmodule) + source + .d.ts
package.json
README.md
```


Other docs:

* [Events](./docs/Events.md)
* [Links](./docs/Links.md)
