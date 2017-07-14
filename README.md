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
```javascript
// directly include bundle in HTML
<html>
  <body>
    <script src="../_bundles/trustlines-network.min.js"></script>
  </body>
</html>

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
`TLNetwork.createUser(username, defaultNetwork)`

#### Parameters
- `username` - name of new user
- `defaultNetwork` - address of default currency network

#### Returns
`Promise<Object>`
- `username` - name of new user
- `address` - ethereum address of new user
- `keystore` - stringified [eth-lightwallet]() keystore object `IMPORTANT: has to be stored locally on client`

#### Example
```javascript
tlNetwork.createdUser('NewUsername', '0xaed123ffee42f2...').then(newUser => {
    console.log('New user created: ', newUser)
})
```

### Load existing user
`TLNetwork.loadUser(serializedKeystore, defaultNetwork)`

#### Parameters
- `serializedKeystore` - stringified [eth-lightwallet]() key store object
- `defaultNetwork` - default currency network address

#### Returns
`Promise<Object>`
- `username` - name of loaded user
- `address` - ethereum address of loaded user
- `keystore` - stringified [eth-lightwallet]() keystore object

#### Example
```javascript
const keystore = '{"encSeed":{"encStr":"fdlM/t...,[...],"nonce":"mWCUhPdymK4VrR52a2ZHSibjXZcuclSh"},"salt":"njcNILd2XXQpF9ki4YzSiAfVPUzQu89WKlkI7F4/eXA=","version":2}'

tlNetwork.loadUser(keystore, '0xaed123ffee42f2...').then(loadedUser => {
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
`TLNetwork.trustline.getAll()`

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
tlNetwork.trustline.getAll().then(trustlines => {
    console.log('Trustlines of loaded user in default currency network: ', trustlines)
})
```

### Get specific trustline
`TLNetwork.trustline.get(addressB)`

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
tlNetwork.trustline.get('0xabc123bb...').then(trustline => {
    console.log('Trustline of loaded user in default currency network to user 0xabc123bb...: ', trustline)
})
```

### Prepare credit line update
`TLNetwork.trustline.prepareUpdate`

### Prepare credit line accept
`TLNetwork.trustline.prepareAccept`

###

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
