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

## API Documentation
The `TLNetwork` object has following main modules:
- [`User`](###User)
  - [`create`](####create)
  - [`load`](####load)
  - [`createOnboardingMsg`](####createOnboardingMsg)
  - [`prepOnboarding`](####prepOnboarding)
  - [`confirmOnboarding`](####confirmOnboarding)
  - [`showSeed`](####showSeed)
  - [`recoverFromSeed`](####recoverFromSeed)
  - [`exportPrivateKey`](####exportPrivateKey)
  - [`getBalance`](####getBalance)
- `CurrencyNetwork`(###CurrencyNetwork)
  - [`getAll`](####getAll)
  - [`getInfo`](####getInfo)
  - [`getUsers`](####getUsers)
  - [`getUserOverview`](####getUserOverview)
  - [`getDecimals`](####getDecimals)
  - [`isNetwork`](####isNetwork)
- `Trustline`
- `Payment`
- `Event`

## `User`
These are user related functions, which also include keystore related methods.

### `create`
Creates new user and respective keystore.
```javascript
TLNetwork.user.create()
```
#### Returns
`Promise<Object>`
- `user` - user / wallet object
  - `address` - checksum ethereum address
  - `pubKey` - public key
  - `keystore` - serialized [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet) keystore object. **NOTE: Has to be stored locally on client**
#### Example
```javascript
tlNetwork.user.create().then(newUser => {
  console.log('New user created: ', newUser)
  // {
  //   'address': '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  //   'pubKey': 'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472',
  //   'keystore': '{"encSeed":{"encStr":"UJrWA...'
  // }
})
```

---

### `load`
Loads an existing user and keystore.
```javascript
TLNetwork.user.load(serializedKeystore)
```
#### Parameters
- `serializedKeystore` - stringified [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet) key store object
#### Returns
`Promise<Object>`
- `user` - user / wallet object
  - `address` - checksum ethereum address
  - `pubKey` - public key
  - `keystore` - serialized keystore object
#### Example
```javascript
const keystore = '{"encSeed":{"encStr":"fdlM/t...'

tlNetwork.user.load(keystore).then(loadedUser => {
  console.log('Existing user loaded: ', loadedUser)
  // {
  //   'address': '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  //   'pubKey': 'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472',
  //   'keystore': '{"encSeed":{"encStr":"UJrWA...'
  // }
})
```

---

### `createOnboardingMsg`
Returns a shareable link, which can be opened by other users who already have ETH and are willing to send some of it to the new user. Called by a new user who wants to *get onboarded*, respectively has no ETH and trustline.

```
TLNetwork.user.createOnboardingMsg(username, keystore)
```
#### Parameters
- `username` - name of new user who wants to get onboarded
- `keystore` - serialized [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet) keystore object of new user who wants to get onboarded
#### Returns
`Promise<string>`
- `http://trustlines.network/v1/onboardingrequest/:username/:adress/:pubKey`
    - `username` - name of new user who wants to get onboarded
    - `address` - checksum ethereum address
    - `pubKey` - public key of new user
#### Example
```javascript
const keystore = '{"encSeed":{"encStr":"fdlM/t...'

tlNetwork.user.createOnboardingMsg('Alice', keystore).then(link => {
  console.log(link)
  // http://trustlines.network/v1/onboardingrequest/Alice/0xf8E191d2cd72Ff35CB8F012685A29B31996614EA/a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472
})
```

---

### `prepOnboarding`
Returns a tx object for onboarding a new user. Called by a user who already has ETH and wants to *onboard* a new user by sending some of it.
```
TLNetwork.user.prepOnboarding(newUserAddress, initialValue)
```
#### Parameters
- `newUserAddress` - address of new user who wants to get onboarded
- `initialValue` - (optional) value of ETH to send, default is 0.1
#### Returns
`Promise<Object>`
- `tx` - tx object
  - `rawTx` - hex string of raw tx
  - `ethFees` - estimated tx fees
    - `raw` - fees in wei
    - `value` - fees in ETH
    - `decimals` - 18
#### Example
```javascript
const newUserAddress = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'

tlNetwork.user.prepOnboarding(newUserAddress).then(onboardingTx => {
  console.log(onboardingTx)
  // {
  //     rawTx: '0x...',
  //     ethFees: {
  //         raw: '100000000000000000',
  //         value: '0.1',
  //         decimals: 18
  //     }
  // }
})
```

---

### `confirmOnboarding`
Posts raw onboarding tx to relay server and returns the tx hash.
```
TLNetwork.user.confirmOnboarding(rawTx)
```
#### Parameters
- `rawTx` - hex string of raw tx returned by [`prepOnboarding`](###prepOnboarding)
#### Returns
`Promise<string>`
- `txHash` - tx hash of onboarding transaction
#### Example
```javascript
tlNetwork.user.confirmOnboarding('0x...').then(txHash => {
  console.log(txHash)
  // '0xfc39b4696d72c6276be3e22406b36fdff1866b9f4364280139b5c8340782294a'
})
```

---

### `getBalance`
Returns ETH balance of user.
```
TLNetwork.user.getBalance()
```
#### Returns
`Promise<string>`
- `balance` - balance of loaded user as a string
#### Example
```javascript
tlNetwork.user.getBalance().then(balance => {
  console.log(balance)
  // '1.2345'
})
```

---

### `showSeed`
Returns the 12 word seed of user.
```
TLNetwork.user.showSeed()
```
#### Returns
`Promise<string>` - 12 word seed string
#### Example
```javascript
tlNetwork.user.showSeed().then(seed => {
  console.log(seed)
  // 'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'
})
```

---

### `recoverFromSeed`
Recovers wallet / keystore from 12 word seed phrase.
```
TLNetwork.user.recoverFromSeed(seed)
```
#### Parameters
- `seed` - 12 word seed string
#### Returns
`Promise<Object>`
- `user` - recovered user object as returned from [`user.create()`](###create)
  - `address` - checksum ethereum address
  - `pubKey` - public key of recovered user
  - `keystore` - serialized [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet) keystore object
#### Example
```javascript
const seed = 'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'

tlNetwork.user.recoverFromSeed(seed).then(recoveredUser => {
  console.log(recoveredUser)
  // {
  //   'address': '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  //   'pubKey': 'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472',
  //   'keystore': '{"encSeed":{"encStr":"UJrWA...'
  // }
})
```

---

### `exportPrivateKey`
Returns private key of loaded user as a string.
```
TLNetwork.user.exportPrivatKey()
```
#### Returns
`Promise<string>`
- `privateKey` - private key as string
#### Example
```javascript
tlNetwork.user.exportPrivateKey().then(privateKey => {
  console.log(privateKey)
  // 'fe488d...'
})
```

---

## CurrencyNetwork

### `getAll`
Returns all registered currency networks.
```
TLNetwork.currencyNetwork.getAll()
```
#### Returns
`Promise<object[]>`
- `currencyNetwork`
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
