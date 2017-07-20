# trustlines-network clientlib

## Get started
### Install dependencies
```
$ npm install
```

### Start mocked relay server
```
$ json-server ./test/mockRelayAPI.json --routes ./test/routes.json
```
The relay server will run on `http://localhost:3000` per default

### Import bundle in HTML
```html
<html>
  <body>
    <script src="../_bundles/trustlines-network.min.js"></script>
  </body>
</html>
```

### Import using ES6
```javascript
import { TLNetwork } from "trustlines-network"

```

## How to use
### Initialization
```javascript
const config = {
  protocol: 'http',
  host: 'localhost',
  port: 3000,
  path: 'api/',
  pollInterval: 500,
  useWebSockets: false,
  wsProtocol: 'ws'
}
const tlNetwork = new TLNetwork(config)
```

### Create new user
`TLNetwork.user.create()`

#### Returns
`Promise<Object>`
- `address` - address of externally owned account
- `proxyAddress` - address of proxy contract (precomputed)
- `keystore` - stringified [eth-lightwallet]() keystore object `IMPORTANT: has to be stored locally on client`

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
- `proxyAddress` - address of proxy contract (precomputed)
- `keystore` - stringified [eth-lightwallet]() keystore object

#### Example
```javascript
const keystore = '{"encSeed":{"encStr":"fdlM/t...,[...],"nonce":"mWCUhPdymK4VrR52a2ZHSibjXZcuclSh"},"salt":"njcNILd2XXQpF9ki4YzSiAfVPUzQu89WKlkI7F4/eXA=","version":2}'

tlNetwork.user.load(keystore).then(loadedUser => {
    console.log('Existing user loaded: ', loadedUser)
})
```

### Get all registered currency networks
`TLNetwork.currencyNetwork.getAll()`

#### Returns
`Promise<object[]>`
- `address` - address of currency network
- `name` - name of currency network
- `abbreviation` - abbreviation of currency (i.e. EUR, USD)
- `symbol` - symbol of currency

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
- `symbol` - symbol of currency
- `numUsers` - number of users in currency network
- `// more information of currency network`

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
- `name` - name of currency network
- `abbreviation`
- `symbol`
- `balance` - sum over balances of all trustlines user has in currency network
- `creditLinesGiven` - sum of all credit lines given by user in currency network
- `creditLinesReceived` - sum of all credit lines received by user in currency network
- `numTrustlines` - number of trustlines user has in currency network

#### Example
```javascript
tlNetwork.currencyNetwork.getUserOverview('0xabc123bb...', '0xb33f33...').then(overview => {
    console.log('Overview for user 0xb33f33... in currency network 0xabc123bb...', overview)
})
```

### Get trustlines of user in currency network
`TLNetwork.trustline.getAll(networkAddress)`

#### Parameters
- `networkAddress` - address of currency network

#### Returns
`Promise<object[]>`
- `addressB` - address of counterparty
- `balance` - balance of trustline from view of requestor
- `given` - credit line given by requestor
- `leftGiven` - given - balance
- `received` - credit line received
- `leftReceived` - received + balance
- `interestRate` - interest rate of trustline

#### Example
```javascript
tlNetwork.trustline.getAll('0xabc123bb...').then(trustlines => {
    console.log('Trustlines of loaded user in currency network 0xabc123bb...: ', trustlines)
})
```

### Get specific trustline
`TLNetwork.trustline.get(networkAddress, addressB)`

#### Parameters
- `networkAddress` - address of currency network
- `addressB` - address of counterparty

#### Returns
`Promise<object>`
- `addressB` - address of counterparty
- `balance` - balance of trustline from view of requestor
- `given` - credit line given by requestor
- `leftGiven` - given - balance
- `received` - credit line received
- `leftReceived` - received + balance
- `interestRate` - interest rate of trustline

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
- `creditor` - proxy address of creditor
- `debtor` - proxy address of debtor
- `type` - type of event 'CreditlineUpdateRequest'
- `value` - value of credit line

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
- `creditor` - proxy address of creditor
- `debtor` - proxy address of debtor
- `type` - type of event 'CreditlineUpdateRequest'
- `value` - updated value of credit line

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

### Get transfers
`TLNetwork.payment.get(networkAddress, filter)`

#### Parameters
- `networkAddress` - address of currency network
- `filter` (optional) - { fromBlock: number, toBlock: number }

#### Returns
`Promise<object[]>`
- `blockNumber` - number of block
- `from` - proxy address of sender of transfer
- `to` - proxy address of receiver of transfer
- `type` - type of event 'Transfer'
- `value` - value of transfer

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

### Get events
`TLNetwork.event.get(network, filter)`

#### Parameters
- `network` - address of currency network
- `filter` (optional) - { type, fromBlock, toBlock }

#### Returns
`Promise<object[]>`
- `blockNumber`
- `event`

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
