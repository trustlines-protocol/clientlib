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

### Import bundle
```html
// directly include bundle in HTML
<html>
  <body>
    <script src="../_bundles/trustlines-network.min.js"></script>
  </body>
</html>
```
```javascript
// OR using es6 import
import { TLNetwork } from "../_bundles/trustlines-network"

```

## How to use
### Initialization
```javascript
const config = {
    host: "localhost",
    port: 3000,
    useWebSockets: false
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
tlNetwork.user.create('username').then(newUser => {
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
`TLNetwork.currencyNetwork.getInfo(address)`

#### Parameters
- `address` - address of currency network

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

### Get all user addresses in currency network
`TLNetwork.currencyNetwork.getUsers(address)`

#### Parameters
- `address` - address of currency network

#### Returns
`Promise<string[]>`
- `string` - ethereum addresses of users in a currency network

#### Example
```javascript
tlNetwork.currencyNetwork.getUsers('0xabc123bb...').then(addresses => {
    console.log('Addresses of users in network 0xabc123bb...', addresses )
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
    console.log('Trustlines of loaded user in currency network: ', trustlines)
})
```

### Get specific trustline
`TLNetwork.trustline.get(networkAddress, addressB)`

#### Parameters
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
tlNetwork.trustline.get('0xabc123bb...', '0xabc123bb...').then(trustline => {
    console.log('Trustline of loaded user in currency network to user 0xabc123bb...: ', trustline)
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

### Prepare credit line update
`TLNetwork.trustline.prepareUpdate`

### Prepare credit line accept
`TLNetwork.trustline.prepareAccept`

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

### Prepare transfers
`TLNetwork.payment.prepare`

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
