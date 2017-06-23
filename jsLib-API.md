### getNetworks

Returns all networks the user is currently connected to

```javascript
getNetworks(ownAddress)
```

##### return
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
getTrustlines(ownAddress)
```

##### arguments

|argument|type|example||
|---|---|---|---|
|ownAddress|string|0x124678||
|filter|object|{network: ‘eur'}|@see lodash|
||function|(transaction) => (transaction.amount > 10)||

##### return
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

### getTransactions
```javascript
getTransactions(ownAddress, filter)
```

##### arguments

|argument|type|example||
|---|---|---|---|
|ownAddress|string|0x124678||
|filter|object|{network: ‘eur'}|@see lodash|
||function|(transaction) => (transaction.amount > 10)||

##### return
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

###send
```javascript
send(address, subject)
```

##### arguments

|argument|type|example|
|---|---|---|
|address|string|0x124678|
|amount|float|1.23|
|network|string|0x124678|
|subject|string|2x beer|


##### return
```javascript
{
	transactionId
}
```
