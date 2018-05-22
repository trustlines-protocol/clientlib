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
  protocol: 'https',
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
- [`CurrencyNetwork`](###CurrencyNetwork)
  - [`getAll`](####getAll)
  - [`getInfo`](####getInfo)
  - [`getUsers`](####getUsers)
  - [`getUserOverview`](####getUserOverview)
  - [`getDecimals`](####getDecimals)
  - [`isNetwork`](####isNetwork)
- [`Trustline`](###Trustline)
  - [`prepareUpdate`](####trustline.prepareUpdate)
  - [`prepareAccept`](####trustline.prepareAccept)
  - [`confirm`](####trustline.confirm)
  - [`getAll`](####trustline.getAll)
  - [`get`](####trustline.get)
  - [`getRequests`](####trustline.getRequests)
  - [`getUpdates`](####trustline.getUpdates)
- [`Payment`](###Payment)
  - [`prepare`](####payment.prepare)
  - [`confirm`](####payment.confirm)
  - [`get`](####payment.get)
  - [`getPath`](####payment.getPath)
- [`Event`](###Event)

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
  console.log(newUser)
  // {
  //   address: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  //   pubKey: 'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472',
  //   keystore: '{"encSeed":{"encStr":"UJrWA...'
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
  console.log(loadedUser)
  // {
  //   address: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  //   pubKey: 'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472',
  //   keystore: '{"encSeed":{"encStr":"UJrWA...'
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
`Promise<object>`
- `balance` - balance object of loaded user
    - `raw` - balance in wei
    - `value` - balance in ETH
    - `decimals` - 18, decimals of ETH
#### Example
```javascript
tlNetwork.user.getBalance().then(balance => {
  console.log(balance)
  // {
  //   balance: {
  //     raw: '1000000000000000000',
  //     value: '1',
  //     decimals: 18
  //   }
  // }
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
  //   address: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  //   pubKey: 'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472',
  //   keystore: '{"encSeed":{"encStr":"UJrWA...'
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
- `currencyNetwork` - currency network object
  - `address` - address of currency network
  - `name` - name of currency network
  - `abbreviation` - abbreviation of currency (i.e. EUR, USD)
#### Example
```javascript
tlNetwork.currencyNetwork.getAll().then(networks => {
  console.log(networks)
  // [
  //   {
  //     name: 'Hours',
  //     abbreviation: 'HOU',
  //     address: '0xC0B33D88C704455075a0724AA167a286da778DDE'
  //   },
  //   {
  //     name: 'Fugger',
  //     abbreviation: 'FUG',
  //     address: '0x55bdaAf9f941A5BB3EacC8D876eeFf90b90ddac9'
  //   }
  // ]
})
```

---

### `getInfo`
Returns detailed information of specific currency network.
```
TLNetwork.currencyNetwork.getInfo(networkAddress)
```
#### Parameters
- `networkAddress` - address of currency network
#### Returns
`Promise<object>`
- `currencyNetwork` - currency network object
  - `abbreviation` - abbreviation of currency (i.e. EUR, USD)
  - `address` - address of currency network
  - `decimals` - number of decimals specified in currency network
  - `name` - name of currency network
  - `numUsers` - number of users in currency network
#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'

tlNetwork.currencyNetwork.getInfo(networkAddress).then(network => {
  console.log(network)
  // {
  //   decimals: 2,
  //   name: 'Hours',
  //   numUsers: 3,
  //   abbreviation: 'HOU',
  //   address: '0xC0B33D88C704455075a0724AA167a286da778DDE'
  // }
})
```

---

### `getUsers`
Returns all addresses of users in a currency network.
```
TLNetwork.currencyNetwork.getUsers(networkAddress)
```
#### Parameters
- `networkAddress` - address of currency network
#### Returns
`Promise<string[]>`
- `address[]` - addresses of users in a currency network
#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'

tlNetwork.currencyNetwork.getUsers(networkAddress).then(userAddresses => {
  console.log(userAddresses)
  // [
  //   '0xcbF1153F6e5AC01D363d432e24112e8aA56c55ce',
  //   '0x7Ff66eb1A824FF9D1bB7e234a2d3B7A3b0345320',
  //   '0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b',
  //    ...
  // ]
})
```

---

### `getUserOverview`
Returns overview of a user in a specific currency network
```
TLNetwork.currencyNetwork.getUserOverview(networkAddress, userAddress)
```
#### Parameters
- `networkAddress` - address of currency network
- `userAddress` - address of user
#### Returns
`Promise<object>`
- `userOverview` - user overview object
  - `balance` - sum over balances of all trustlines user has in currency network
    - `raw` - balance in smallest unit
    - `value` - balance in biggest unit
    - `decimals` - decimals specified in currency network
  - `given` - sum of all credit lines given by user in currency network
    - `raw` - given credit lines in smallest unit
    - `value` - given credit lines in biggest unit
    - `decimals` - decimals specified in currency network
  - `received` - sum of all credit lines received by user in currency network
    - `raw` - received credit lines in smallest unit
    - `value` - received in biggest unit
    - `decimals` - decimals specified in currency network
  - `leftGiven` - given - balance
    - `raw` - given - balance in smallest unit
    - `value` - given - balance in biggest unit
    - `decimals` - decimals specified in currency network
  - `leftReceived` - received + balance
    - `raw` - received + balance in smallest unit
    - `value` - received + balance in biggest unit
    - `decimals` - decimals specified in currency network
#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'
const userAddress = '0xcbF1153F6e5AC01D363d432e24112e8aA56c55ce'

tlNetwork.currencyNetwork.getUserOverview(networkAddress, userAddress).then(overview => {
  console.log(overview)
  // {
  //   leftReceived: {
  //     raw: '26073',
  //     value: '260.73',
  //     decimals: 2
  //   },
  //   balance: {
  //     raw: '-3927',
  //     value: '-39.27',
  //     decimals: 2
  //   },
  //   given: {
  //     raw: '30000',
  //     value: '300.00',
  //     decimals: 2
  //   },
  //   received: {
  //     raw: '30000',
  //     value: '300.00',
  //     decimals: 2
  //   },
  //   leftGiven: {
  //     raw: '33927',
  //     value: '339.27',
  //     decimals: 2
  //   }
  // }
})
```

---

### `getDecimals`
Returns the decimals specified in a currency network.
```
TLNetwork.currencyNetwork.getDecimals(networkAddress)
```
#### Parameters
- `networkAddress` - address of currency network
#### Returns
`Promise<number>`
- `decimals` - decimals specified in currency network
#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'

tlNetwork.currencyNetwork.getDecimals(networkAddress).then(decimals => {
  console.log(decimals)
  // 2
})
```

---

### `isNetwork`
Returns true or false whether given address is a registered currency network.
```
TLNetwork.currencyNetwork.isNetwork(networkAddress)
```
#### Parameters
- `networkAddress` - address of currency network
#### Returns
`Promise<boolean>`
- `isNetwork` - true or false if address is a registered currency network
#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'

tlNetwork.currencyNetwork.isNetwork(networkAddress).then(isNetwork => {
  console.log(isNetwork)
  // true
})
```

---

## `Trustline`

### `trustline.prepareUpdate`
Prepares a tx object for creating a trustline update request.
```
TLNetwork.trustline.prepareUpdate(network, counterparty, given, received[, options])
```
#### Parameters
- `network` - address of currency network
- `counterparty` - address of counterparty who receives trustline update request
- `given` - proposed value of credit line given to counterparty, i.e. 100 if network has to 2 decimals
- `received` - proposed value of credit line received from counterparty, i.e. 100 if network has to 2 decimals
- `options` - optional
  - `decimals` - decimals of currency network can be provided manually if know
  - `gasPrice`
  - `gasLimit`
#### Returns
`Promise<object>`
- `txObj` - tx object
  - `ethFees` - estimated transaction fees in ETH
  - `rawTx` - RLP-encoded hex string defining the transaction
```javascript
const network = '0xC0B33D88C704455075a0724AA167a286da778DDE'
const counterparty = '0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b'

tlNetwork.trustline.prepareUpdate(network, counterparty, 100, 200)
  .then(txObj => {
    console.log(txObj)
    // {
    //   rawTx: '0x...',
    //   ethFees: {
    //     raw: '100000000000000000',
    //     value: '0.1',
    //     decimals: 18
    //   }
    // }
})
```

---

### `trustline.prepareAccept`
Prepares a tx object for accepting a trustline update request.
```
TLNetwork.trustline.prepareAccept(network, initiator, given, received[, options])
```
#### Parameters
- `network` - address of currency network
- `initiator` - address of user who initiated / created the trustline update request
- `given` - proposed value of given credit line `initiator -> counterparty`, i.e. 100 if network has to 2 decimals
- `received` - proposed value of received credit `counterparty -> initiator`, i.e. 100 if network has to 2 decimals
- `options` - optional
  - `decimals` - decimals of currency network can be provided manually if know
  - `gasPrice`
  - `gasLimit`
#### Returns
`Promise<object>`
- `txObj` - tx object
  - `ethFees` - estimated transaction fees in ETH
  - `rawTx` - RLP-encoded hex string defining the transaction
```javascript
const network = '0xC0B33D88C704455075a0724AA167a286da778DDE'
const counterparty = '0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b'

tlNetwork.trustline.prepareAccept(network, counterparty, 100, 200)
  .then(txObj => {
    console.log(txObj)
    // {
    //   rawTx: '0x...',
    //   ethFees: {
    //     raw: '100000000000000000',
    //     value: '0.1',
    //     decimals: 18
    //   }
    // }
})
```

---

### `trustline.confirm`
Relays raw transaction as returned in `prepareUpdate` or `prepareAccept`.
```
TLNetwork.trustline.confirm(rawTx)
```
#### Parameters
- `rawTx` - RLP-encoded hex string defining the transaction
#### Returns
`Promise<string>`
- `txHash` - tx hash of onboarding transaction
### Example
```javascript
const { rawTx } = txObj

tlNetwork.trustline.confirm(rawTx).then(txHash => {
  console.log(txHash)
  // 0x...
})
```

---

### `trustline.get`
Returns trustline in a specified currency network and counterparty address.
```
TLNetwork.trustline.get(networkAddress, counterpartyAddress)
```
#### Parameters
- `networkAddress` - address of currency network
- `counterpartyAddress` - address of counterparty
#### Returns
`Promise<object>`
- `trustline` - trustline object
  - `id` - identifier hash of trustline
  - `address` - checksummed ethereum address of counterparty
  - `balance` - balance of trustline from view of requestor
  - `given` - credit line given by requestor
  - `leftGiven` - given - balance
  - `received` - credit line received
  - `leftReceived` - received + balance
#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'
const counterpartyAddress = '0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b'

tlNetwork.trustline.get(networkAddress, counterpartyAddress).then(trustline => {
    console.log(trustline)
    // {
    //   id: '0x314338891c370d4c77657386c676b6cd2e4862af1244820f9e7b9166d181057f',
    //   address: '0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b',
    //   balance: {
    //     raw: '-102',
    //     value: '-1.02',
    //     decimals: 2
    //   },
    //   given: {
    //     raw: '10000',
    //     value: '100',
    //     decimals: 2
    //   },
    //   leftGiven: {
    //     raw: '10102',
    //     value: '101.02',
    //     decimals: 2
    //   },
    //   received: {
    //     raw: '10000',
    //     value: '100',
    //     decimals: 2
    //   },
    //   leftReceived: {
    //     raw: '9898',
    //     value: '98.98',
    //     decimals: 2
    //   }
    // }
})
```

---

### `trustline.getAll`
Returns all trustlines of a loaded user in a currency network.
```
TLNetwork.trustline.getAll(networkAddress)
```
#### Parameters
- `networkAddress` - address of currency network
#### Returns
`Promise<object[]>`
- `trustline[]` - array of trustline objects
  - `id` - identifier hash of trustline
  - `address` - checksummed ethereum address of counterparty
  - `balance` - balance of trustline from view of requestor
  - `given` - credit line given by requestor
  - `leftGiven` - given - balance
  - `received` - credit line received
  - `leftReceived` - received + balance
#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'

tlNetwork.trustline.getAll(networkAddress).then(trustlines => {
    console.log(trustlines)
    // [
    //   {
    //     id: '0x987e38fc52eb557bbe7fa7d93bde10dbdc744d824fa35a27b01f76a36a3e8b16'
    //     address: '0xcbF1153F6e5AC01D363d432e24112e8aA56c55ce',
    //     leftReceived: {
    //       raw: '26073',
    //       value: '260.73',
    //       decimals: 2
    //     },
    //     balance: {
    //       raw: '-3927',
    //       value: '-39.27',
    //       decimals: 2
    //     },
    //     given: {
    //       raw: '30000',
    //       value: '300.00',
    //       decimals: 2
    //     },
    //     received: {
    //       raw: '30000',
    //       value: '300.00',
    //       decimals: 2
    //     },
    //     leftGiven: {
    //       raw: '33927',
    //       value: '339.27',
    //       decimals: 2
    //     }
    //   },
    //   ...
    // ]
})
```

---

### `trustline.getRequests`
Returns trustline update requests of loaded user in a currency network.
```
TLNetwork.trustline.getRequests(networkAddress[, filter])
```
#### Parameters
- `networkAddress` - address of currency network
- `filter` - optional filter object to specify block range
  - `fromBlock` - the block number from which to get trustline update requests on
#### Returns
`Promise<object[]>`
- `updateRequest[]` - array of trustline update requests
  - `from` - ethereum address of user who created request
  - `to` - ethereum address of user who is the counterparty of request
  - `given` - proposed amount of given credit line `from -> to`
  - `received` - proposed amount of received credit `to -> from` 
  - `direction` - `sent` if loaded user created request | `received` if loaded user is the counterparty of request
  - `networkAddress` - address of currency network
  - `type` - `TrustlineUpdateRequest`
  - `timestamp` - unix timestamp
  - `blockNumber` - number of block
  - `status` - `sent` | `pending` | `confirmed` depending block height
  - `transactionId` - transaction hash of event
#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'
const filter = { fromBlock: 6000000 }

tlNetwork.trustline.getRequests(networkAddress, filter).then(requests => {
    console.log(requests)
    // [
    //   {
    //     from: '0xcbF1153F6e5AC01D363d432e24112e8aA56c55ce',
    //     to: '0x7Ff66eb1A824FF9D1bB7e234a2d3B7A3b0345320',
    //     given: {
    //       raw: '20000',
    //       value: '200',
    //       decimals: 2
    //     },
    //     received: {
    //       raw: '20000',
    //       value: '200',
    //       decimals: 2
    //     },
    //     direction: 'sent',
    //     networkAddress: '0xC0B33D88C704455075a0724AA167a286da778DDE',
    //     type: 'TrustlineUpdateRequest',
    //     timestamp: 1524655432,
    //     blockNumber: 6000001,
    //     status: 'confirmed',
    //     transactionId: '0xb141aa3baec4e7151d8bd6ecab46d26b1add131e50bcc517c956a7ac979815cd'
    //   },
    //   ...
    // ]
})
```

---

### `trustline.getUpdates`
Returns trustline updates of loaded user in a currency network. A update happens when an user accepts a trustline update request.
```
TLNetwork.trustline.getUpdates(networkAddress[, filter])
```
#### Parameters
- `networkAddress` - address of currency network
- `filter` - optional filter object to specify block range
  - `fromBlock` - the block number from which to get trustline update requests on
#### Returns
`Promise<object[]>`
- `update[]` - array of trustline updates
  - `from` - ethereum address of user who created request
  - `to` - ethereum address of user who accepted request
  - `given` - accepted amount of given credit line `from -> to`
  - `received` - accepted amount of received credit `to -> from` 
  - `direction` - `sent` if loaded user created request | `received` if loaded user accepted request
  - `networkAddress` - address of currency network
  - `type` - `TrustlineUpdate`
  - `timestamp` - unix timestamp
  - `blockNumber` - number of block
  - `status` - `sent` | `pending` | `confirmed` depending block height
  - `transactionId` - transaction hash of event

#### Example
```javascript
const networkAddress = '0xC0B33D88C704455075a0724AA167a286da778DDE'
const filter = { fromBlock: 6000000 }

tlNetwork.trustline.getUpdates(networkAddress, filter).then(updates => {
    console.log(updates)
    // [
    //   {
    //     from: '0xcbF1153F6e5AC01D363d432e24112e8aA56c55ce',
    //     to: '0x7Ff66eb1A824FF9D1bB7e234a2d3B7A3b0345320',
    //     given: {
    //       raw: '20000',
    //       value: '200',
    //       decimals: 2
    //     },
    //     received: {
    //       raw: '20000',
    //       value: '200',
    //       decimals: 2
    //     },
    //     direction: 'sent',
    //     networkAddress: '0xC0B33D88C704455075a0724AA167a286da778DDE',
    //     type: 'TrustlineUpdate',
    //     timestamp: 1524655432,
    //     blockNumber: 6000001,
    //     status: 'confirmed',
    //     transactionId: '0xb141aa3baec4e7151d8bd6ecab46d26b1add131e50bcc517c956a7ac979815cd'
    //   },
    //   ...
    // ]
})
```

---

## Payment

### `payment.prepare`
Prepares tx object for a trustlines transfer.
```
TLNetwork.payment.prepare(network, receiver, value[, options])
```
#### Parameters
- `network` - address of currency network
- `to` - address of receiver of transfer
- `value` - amount to transfer, i.e. 1.50 if currency network has 2 decimals
- `options`
  - `decimals` - decimals fo currency network can be given manually if known
  - `gasPrice`
  - `gasLimit`
#### Returns
`Promise<object>`
- `txObj` - tx object for a trustline transfer
  - `rawTx` - RLP-encoded hex string defining the transaction
  - `path` - addresses of users in the social graph that are used for facilitating the transfer
  - `maxFees` - upper bound of estimated fees for transfer in trustlines money
  - `ethFees` - estimated transaction fees in ETH
#### Example
```javascript
const network = '0xC0B33D88C704455075a0724AA167a286da778DDE'
const to = '0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b'

tlNetwork.payment.prepare(network, to, 3.50)
  .then(txObj => {
    console.log(txObj)
    // {
    //   rawTx: '0x...',
    //   path: ['0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b'], // direct path
    //   maxFees: {
    //     raw: '1',
    //     value: '0.01',
    //     decimals: 2
    //   },
    //   ethFees: {
    //     raw: '100000000000000000',
    //     value: '0.1',
    //     decimals: 18
    //   }
    // }
  })
```

---

### `payment.confirm`
Relays raw transfer tx.
```
TLNetwork.payment.confirm(rawTx)
```
#### Parameters
- `rawTx` - RLP-encoded hex string defining the transaction
#### Returns
`Promise<string>`
- `txHash` - transaction hash of transfer tx
#### Example
```javascript
const { rawTx } = transferTxObj

tlNetwork.payment.confirm(rawTx).then(txHash => {
  console.log(txHash)
  // 0x...
})
```

---

### `payment.get`
Returns transfer logs of loaded user in a specified currency network.
```
TLNetwork.payment.get(network[, filter])
```
#### Parameters
- `network` - address of currency network
- `filter` (optional)
  - `fromBlock`
#### Returns
`Promise<object[]>`
- `transfer[]` - array of transfer objects
  - `from` - ethereum address of user who sent transfer
  - `to` - ethereum address of user who received transfer
  - `amount` - transfer amount
    - `raw` - amount in smallest unit
    - `value` - amount in biggest unit
    - `decimals` - decimals in currency network
  - `direction` - `sent` if loaded user sent transfer | `received` if loaded user received transfer
  - `networkAddress` - address of currency network
  - `type` - `Transfer`
  - `timestamp` - unix timestamp
  - `blockNumber` - number of block
  - `status` - `sent` | `pending` | `confirmed` depending block height
  - `transactionId` - transaction hash of event
#### Example
```javascript
const network = '0xC0B33D88704455075a0724AA167a286da778DDE'
const filter = { fromBlock: 7000000 }

tlNetwork.payment.get(network, filter).then(transfers => {
  console.log(transfers)
  // [
  //   {
  //     from: '0xcbF1153F6e5AC01D363d432e24112e8aA56c55ce',
  //     to: '0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b',
  //     amount: {
  //       raw: '100',
  //       value: '1',
  //       decimals: 2
  //     },
  //     direction: 'sent',
  //     networkAddress: '0xC0B33D88C704455075a0724AA167a286da778DDE',
  //     type: 'Transfer',
  //     timestamp: 1524755036,
  //     blockNumber: 7011809,
  //     status: 'confirmed',
  //     transactionId: '0x05c91f6506e78b1ca2413df9985ca7d37d2da5fc076c0b55c5d9eb9fdd7513a6'
  //   }
  // ]
})
```

---

### `payment.getPath`
Returns path object which contains a transfer path between two users in specified currency network.
```
TLNetwork.payment.getPath(network, accountA, accountB, value[, options])
```
#### Parameters
- `network` - address of currency network
- `accountA` - address of user who sends transfer
- `accountB` - address of user who receives transfer
- `value` - transfer amount in biggest unit, i.e. 2.50 if network has 2 decimals
- `options` (optional)
  - `decimals` - decimals of currency network can be provided manually if known
  - `maximumHops` - maximum hops for transfer
  - `maximumFees` - maximum trustline money fees
#### Returns
`Promise<object>`
- `pathObj` - path object
  - `estimatedGas` - estimated gas of transfer
  - `path` - addresses of users in social graph through which the transfer can be facilitated
  - `maxFees` - maximal transfer fees in trustlines money
#### Example
```javascript
const network = '0xC0B33D88704455075a0724AA167a286da778DDE'
const userA = '0xcbF1153F6e5AC01D363d432e24112e8aA56c55ce'
const userB = '0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b'

tlNetwork.payment.getPath(network, userA, userB, 12.5).then(pathObj => {
  console.log(pathObj)
  // {
  //   estimatedGas: 150000,
  //   path: ['0x7Ec3543702FA8F2C7b2bD84C034aAc36C263cA8b'],
  //   maxFees: {
  //     raw: '1',
  //     value: '0.01',
  //     decimals: 2
  //   }
  // }
})
```

---

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
