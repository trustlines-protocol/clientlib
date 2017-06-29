### TLNetwork

```javascript
new TLNetwork([config])
```
Creates a TLNetwork object which provides all methods

##### Arguments
`Object` - optionally takes a `config` object as a argument which consists of

|attribute|type|description|example|
|---|---|---|---|
|config.host|String|Host of relay server (default: localhost)||
|config.port|Number|Port of relay server (default: 5000)||
|config.tokenAddress|String|Address of token (default: localhost)||
|config.pollInterval|Number|Interval for polling relay server in ms (default: 500)||
|config.useWebSockets|Boolean|Flag whether to use web sockets instead of http (default: false)||

##### Example
```javascript
import { TLNetwork } from 'trustlines-network'

const tlNetwork = new TLNetwork()
```

### createUser
```javascript
createUser(username)
```
Creates a new user by generating a private/public key pair

##### Arguments


##### Returns
`Promise <Object, Error>` - created account object :

|attribute|type|description|example|
|---|---|---|---|
|userAddress|String|Address of user||
|publicKey|String|||
|privateKey|String|||

##### Example
```javascript
asdasd
```



### getNetworks

```javascript
getNetworks()
```
Returns all networks the user is currently connected to

##### Returns
`Array` of network objects - a network object consists of:

|attribute|type|description|example|
|---|---|---|---|
|id|String|Identifier of the currency network||
|name|String|Name of the currency network||
|creditlinesGiven|Number|Sum of all creditlines given by the user in the currency network||
|creditlinesReceived|Number|Sum of all creditlines received by the user in the currency network||
|balance|Number|Total balance of the user in the currency network||
|availableFunds|Number|Available funds of the user in the currency network||
|currency|Object|Currency object which consists of `symbol`, `shortCode`, `name`||

`Currency object`:

|attribute|type|description|example|
|---|---|---|---|
|symbol|String|Symbolizes currency|*€*, *$*|
|shortCode|String|Maximal 3 character long abbreviation of name|EUR, USD|
|name|String|Name of currency|Euro, US-Dollar|

##### Example
```javascript
[
  {
    id
    name,
    currency: {
      symbol,
      shortcode,
      name
    },
    creditlines_given, // Sum of all creditline_given
    creditlines_received, // Sum of all creditline_received
    balance,
    availableFunds,
  },
  ...
]
```


### getTrustlines
```javascript
getTrustlines([filter])
```
Returns all or filtered trustlines of the user

##### Arguments

|argument|type|description|example|
|---|---|---|---|
|filter|Object|Filter object|{ network: ‘eur' } (see @lodash_.filter)|
||Function||(transaction) => (transaction.amount > 10)|

##### Returns
`Array` of trustline objects - a trustline object consists of :

|attribute|type|description|example|
|---|---|---|---|
|id|String|Identifier of trustline|0x124678|
|balance|Number|Balance of trustline in point of view of user||
|interestRate|Number|Interest rate specified in trustline||
|network||||
|creditlineGiven|Number|||
|creditlineReceived|Number|||

#### Example
```javascript
[
  {
    id,
    balance,
    interest_rate,
    network,
    creditline_given,
    creditline_received,
    balance_received,
    balance_given,
  },
  ...
]
```

### setCreditLine
```javascript
setCreditLine(debtor, value [, interestRate])
```
Sets credit line to debtor

##### Arguments

|argument|type|description|example|
|---|---|---|---|
|debtor|String|Address of debtor||
|value|Number|Amount of credit line||
|interestRate|Number|Interest rate of credit line||

##### Returns
`Promise <>`

### getTransactions
```javascript
getTransactions(ownAddress[, filter])
```
Returns all or filtered transactions

##### Arguments

|argument|type|description|example|
|---|---|---|---|
|ownAddress|string|address of user||
|filter|object|{network: ‘eur'}|@see lodash|
||function|(transaction) => (transaction.amount > 10)||

##### Returns
`Promise <Array>` of transaction objects - a transaction object consists of :

|argument|type|description|example|
|---|---|---|---|
|id|String|transaction hash||
|trustlineId|String|Identifier of the trustline used for the transaction||
|status|String|Status of the transaction||
|type|String|Type of the transaction||
|networkId|String|Identifier of the network in which the transaction took place||
|timestamp|Date|Date of transaction||
|subject|String|Subject of the transaction||

##### Example
```javascript
[
  {
		id,
		trustline : {
			id,
		}
		status,
		type, // e.g. 'send', 'receive', ...
		timestamp,
		network,
		subject
	},
	...
]
```

### getPath
```javascript
getPath(from, to, value)
```
Returns path for transfer

##### Arguments

|argument|type|description|example|
|---|---|---|---|
|`from`|String|Address of starting point of path|
|`to`|String|Address of end point of path|
|`value`|Number|Amount to transfer|

##### Returns
`Array` with addresses

##### Example
```javascript
[]
```

### sendPayment
```javascript
sendPayment(to, value[, subject])
```

##### Arguments

|argument|type|description|example|
|---|---|---|---|
|to|string|0x124678|
|value|float|1.23|
|subject|string|2x beer|


##### Returns
```javascript
{
	transactionId
}
```
