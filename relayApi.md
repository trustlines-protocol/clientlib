# RELAY API

## `TODO` Get all currency networks
Returns all registered currency networks (similar to `GET tokens/`)

`GET /networks`

### Response
```javascript
{
    networks: [
        {
            address: '0xabef1022e1ff...'
            name: 'Euro',
            abbreviation: 'EUR',
            symbol: '€'
        },
        ... // other currency networks
    ]
}
```

## `TODO` Get information of currency network
Returns all registered currency networks (similar to `GET tokens/:address`)

`GET /networks/:address`

### Response
```javascript
{
    name: 'Euro',
    abbreviation: 'EUR',
    symbol: '€',
    numUsers: 1000,
    ... // other information of currency network
}
```

## `TODO` Get user information of currency network
Returns detailed information of currency network in user context (similar to `GET tokens/:token_address/users/:user_address`)

`GET /networks/:networkAddress/users/:userAddress`

### Response
```javascript
{
    name: 'Euro',
    abbreviation: 'EUR',
    symbol: '€',
    balance: 1000, // sum over balances of all trustlines user has in currency network
    creditLinesGiven: 2000, // sum of all creditlines given by user in currency network
    creditLinesReceived: 3000, // sum of all creditlines received by user in currency network
    numTrustlines: 10
}
```

## `TODO` Get addresses of all currency networks user is in
Returns all address of currency networks a user is part of

`GET /networks/users/:address`

### Response
```javascript
{
    networks: ['0xac33ffg3g...']
}
```

## `TODO` Onboard new user
Send by user who wants to onboard another user by sending small amount of ETH. (similar to `PUT tokens/:token_address/users/:user_address` ?)

## `TODO` Get contacts of user
Returns a list of addresses of all contacts of the user (similar to `GET tokens/:token_address/users/:user_address/friends`)

`GET /networks/:networkAddress/users/:userAddress/contacts`

### Response
```javascript
{
    contacts: ['0xac33ffg3g...']
}
```

## `TODO` Add friend

## `TODO` Get trustline to user
Return a trustline between A and B in a currency network if one exists. (similar to `GET tokens/:token_address/users/:a_address/accounts/:b_address`)

`GET /networks/:networkAddress/users/:userAddressA/trustlines/:userAddressB`

### Response
```javascript
{
    balanceAB: 100, // balance of trustline from POV of user A
    creditLineAB: 500, // credit line given by A
    creditLineBA: 600, // credit line received from B
    interestRate: 0.1
}
```

## `TODO` Get all trustlines of user
Returns a list of trustlines a user has in a currency network (similar to `GET tokens/:token_address/users/:user_address/accounts`)

`GET /networks/:networkAddress/users/:userAddress/trustlines`

### Response
```javascript
{
    trustlines: {
        '0xb33f5gaac...': { // address of user B
            balance: 100, // balance of trustline from POV of user A
            given: 500, // credit line given by A
            leftGiven: 400 // given - balance
            received: 600, // credit line received from B
            leftReceived: 700 // received + balance
            interestRate: 0.1
        },
        ...
    }
}
```

## `TODO` Get path
Returns the cheapest path with calculated fees if existent (similar to `GET tokens/:token_address/users/:a_address/path/:b_address/value/:value`)

`GET /networks/:networkAddress/users/:aAddress/path/:bAddress/value/:value`

### Response
```javascript
{
    path: ['0xabc123bb...', '0xeebc3bb...', ...], // addresses of users in path
    maxFees: 0.12 // maximal fees sender has to pay
}
```

## `TODO` Poll events
Returns events that happened after `offset_timestamp` (similar to `GET tokens/<token_address:token_address>/users/<address:user_address>/block/<int:from_block>/events`)

`GET /users/:userAddress/block/:fromBlock/events`

### Response
```javascript
{
    events: [
        Transfered(networkAddress, receiverAddress, amount, timestamp),
        CreditLineRequest(networkAddress, receiverAddress, amount, timestamp),
        CreditLineAccepted(),
        CreditLineDeclined(),
        CreditLineClosed()
    ]
}
```

## `TODO` Get currency network abi
Returns the ABI of contract (similar to `GET tokenAbi`)

`GET /networkAbi`

### Response
```javascript
// ABI of contract
```

## Get transaction infos
Returns the transaction information

`GET /txinfos/:userAddress`

### Response
```javascript
{
    balance: 1000,
    nonce: 15,
    gasPrice: 10000
}
```

## Send transaction
Sends a signed transaction

`POST /relay`

### Request
```javascript
// rawTransaction
```

### Response
```javascript
{
    txId
}
```
