# Guides

Here you can find useful guides on how to use the core features of the trustlines-clientlib.

- [Note on numbers and fees](#note-on-numbers-and-fees)
- [Create user / wallet](#create-user-/-wallet)
- [Discover currency networks](#discover-currency-networks)
- [Set up trustline](#set-up-trustline)
- [Send transfer](#transfer)

## Note on numbers and fees

### Number format

The trustlines-clientlib returns numbers in the following format

```ts
type Amount = {
  raw: string // = value * decimals^10
  value: string // = raw / decimals^10
  decimals: number
}
```

The representation `raw` is the number in its smallest unit, whereas `value` is the representation in its biggest unit.

### Fees

When preparing a transaction, the clientlib will return a fee that can be interpreted in two ways.

#### Transaction fees

If the `walletType` in the initial configuration is set to `ethers`, then the fee is a regular blockchain fee.
The `TxObjectInternal` object returned by preparing a transaction has a `TxFeesAmounts` property with the usual
`gasPrice`, and `gasLimit` values for blockchain transactions. It also has a `totalFee` field for convenience.
They are denominated in the native cryptocurrency or coins, e.g. `TLC`, `Test TLC`, `ETH`, etc.

#### Delegation fees

If the `walletType` is set to `identity`, the library uses meta-transactions that are relayed, i.e delegated, by the relay server.
The relay server operator pays for the occurring transaction fees and might want to be compensated for this service.
The `TxObjectInternal` object returned by preparing a transaction has a `TxFeesAmounts` property with fields
`gasPrice`, `gasLimit`, `baseFee`, `totalFee`, `feeRecipient` and `currencyNetworkOfFees` so that if the meta-transaction
is applied, the user will owe at most `totalFee = baseFee + gasPrice * gasLimit / 1_000_000` to `feeRecipient` paid in
the currency network `currencyNetworkOfFees`.

If `feeRecipient` is the zero address, then the recipient of the fees will be the delegate that pays for the transaction.

#### Network fees

Additionally, when preparing a trustlines payment, the clientlib will return a `PaymentTxObject` with the `maxFees` property
showing the maximal value of the fees denominated in the currency network that will be paid along the payment path additionally
to the delegation or transaction fees. The `feePayer` property defines whether the sender or recipient of the payment
pays for the fees.

## Create user / wallet

To be able to interact with the trustlines protocol, a user, i.e. wallet, is needed.
You therefore have to create an instance and load it into the library.
The wallet manages your key pair and is used for cryptographically signing transactions,
thus enabling the establishment of trustlines and transfers.
Depending on the initial configuration of the `TLNetwork` instance,
you can create either a new instance of type `ethers` or type `identity`.
The former type is based on the wallet object of the [ethers.js](https://docs.ethers.io/ethers.js/html/) library,
whereas the second type uses an [identity contract](https://github.com/trustlines-protocol/contracts/blob/master/docs/deploy.md#deploy-identity-contracts)
to enable meta-transactions.

### Create instance of type `ethers`

Note that a user of type `ethers` can not use [meta-transactions](https://github.com/trustlines-protocol/contracts/blob/master/docs/deploy.md#deploy-identity-contracts).
The user therefore needs some coins ([TLC](https://explore.tlbc.trustlines.foundation/), [Test TLC](https://explore.laika.trustlines.foundation/), ... ),
depending on the connected relay server and blockchain, before being able to execute a transaction.

```javascript
const laika = new TLNetwork({
  relayUrl: 'https://relay0.testnet.trustlines.network/api/v1',
  messagingUrl: 'https://relay0.testnet.trustlines.network/api/v1',
  walletType: 'ethers'
})

const newEthersUser = await laika.user.create()
await laika.user.loadFrom(newEthersUser)
```

### Create instance of type `identity`

A user of type `identity` makes use of meta-transactions.
Therefore the addresses of the deployed [identity factory](https://github.com/trustlines-protocol/contracts/blob/master/contracts/identity/IdentityProxyFactory.sol)
and [implementation](https://github.com/trustlines-protocol/contracts/blob/master/contracts/identity/Identity.sol)
contracts have to be set.
An additional step of deploying the identity contract of the newly created user is also necessary.

```javascript
const laika = new TLNetwork({
  relayUrl: 'https://relay0.testnet.trustlines.network/api/v1',
  messagingUrl: 'https://relay0.testnet.trustlines.network/api/v1',
  walletType: 'identity',
  identityFactoryAddress: '0x2862ac3efE938Ac6d2bd466Be4842a777818C473',
  identityImplementationAddress: '0x0F4f5Af3A6f072A8A38dBbd7a81523C9Cf878df0'
})

const newIdentityUser = await laika.user.create()
await laika.user.loadFrom(newIdentityUser)

// Additional step to deploy the identity contract of newly created user
const txHash = await laika.user.deployIdentity()
```

## Discover currency networks

The client library provides interfaces for retrieving information on deployed currency networks.

### General information

```js
// All currency networks the relay server knows about
const allDeployedCurrencyNetworks = await tlNetwork.currencyNetwork.getAll()

// Detailed information on specific currency network
const detailedInformation = await tlNetwork.currencyNetwork.getInfo('0x...')

// List of all users in specific currency network
const userAddresses = await tlNetwork.currencyNetwork.getUsers('0x...')
```

### User context

```js
const networkAddress = '0x...'
const userAddress = '0x...'

// Overview of user in specific currency network
const userOverview = await tlNetwork.currencyNetwork.getUserOverview(
  networkAddress,
  userAddress
)
```

## Set up trustline

To set up a trustline, make sure that a user instance is loaded into the library.

### 1. Request for establishing a trustline

Trustlines consist of bi-directional credit agreements.
That means, that they have to be accepted by both parties.
The first step to establish a trustline is therefore to create an initial request or proposal to the counterparty.

```javascript
const tlNetwork1 = new TLNetwork()

// Create and/or load user 1 ...

const networkAddress = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
const counterpartyAddress = '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18'

// Prepare a transaction to request a trustline update
const { rawTx, txFees } = await tlNetwork1.trustline.prepareUpdate(
  networkAddress,
  counterpartyAddress,
  100, // Proposed credit limit given to counterparty
  200 // Proposed credit limit received from counterparty
)
console.log('Transaction fees: ', txFees.totalFee)

// Sign and relay the transaction
const txHash = await tlNetwork1.trustline.confirm(rawTx)
console.log('Transaction hash: ', txHash)
```

The initiator creates a request where he is willing to **lend** a maximal denomination of `100`
to the user with the address `counterpartyAddress` in the currency network with the address `networkAddress`.
He also proposes that he is willing to **owe** a maximal denomination of `200` to the counterparty.

### 2. Accepting a trustline request

In the next step the counterparty has to accept the request.
Note that in the example below the loaded user is the counterparty of step 1.

```javascript
const tlNetwork2 = new TLNetwork()

// Create and/or load user 2 ...

const networkAddress = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'

// Retrieve latest request from step 1
const requests = await tlNetwork2.trustline.getRequests(networkAddress)
const latestRequest = requests[requests.length - 1]
const initiatorAddress = latestRequest.from
const creditlineGivenToInitiator = latestRequest.received.value
const creditlineReceivedFromInitiator = latestRequest.given.value

const { rawTx } = await tlNetwork2.trustline.prepareAccept(
  networkAddress,
  initiatorAddress,
  creditlineGivenToInitiator,
  creditlineReceivedFromInitiator
)

// sign and relay the transaction
const txHash = await tlNetwork2.trustline.confirm(rawTx)
console.log('Transaction hash: ', txHash)
```

The counterparty of step 1 first fetches all trustline requests in the currency network.
The `prepareAccept` function is then called where the attributes `given` and `received` have to be from the point
of view of the caller. So in our case the counterparty or receiver of the initial request.

**NOTE: All numerical values have to be provided in their largest unit.
For example, if the currency network has two decimals, the values have to be in a format like `1.25`.**

## Transfer

The requirement for a successful trustline transfer is a path with enough capacity from the sender
to the receiver in the currency network. It is also to mention that the sender is always the loaded user.

### Transferring trustlines currency

```javascript
const networkAddress = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
const receiverAddress = '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18'

const preparedPayment = await tlNetwork.payment.prepare(
  networkAddress,
  receiverAddress,
  1
)
console.log('Transfer path:', preparedPayment.path)
console.log('Network fees:', preparedPayment.maxFees)
console.log('Fee payer:', preparedPayment.feePayer)

const txHash = await tlNetwork.payment.confirmPayment(preparedPayment)
console.log('Transaction hash: ', txHash)
```
