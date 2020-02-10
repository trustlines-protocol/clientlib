# Class: Transaction

The Transaction class contains functions that are needed for Ethereum transactions.

## Hierarchy

- **Transaction**

## Index

### Constructors

- [constructor](_transaction_.transaction.md#constructor)

### Methods

- [confirm](_transaction_.transaction.md#confirm)
- [prepareContractTransaction](_transaction_.transaction.md#preparecontracttransaction)
- [prepareValueTransaction](_transaction_.transaction.md#preparevaluetransaction)

## Constructors

### constructor

\+ **new Transaction**(`params`: object): _[Transaction](_transaction_.transaction.md)_

**Parameters:**

▪ **params**: _object_

| Name              | Type                                                             |
| ----------------- | ---------------------------------------------------------------- |
| `currencyNetwork` | [CurrencyNetwork](_currencynetwork_.currencynetwork.md)          |
| `provider`        | [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md) |
| `signer`          | [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)         |

**Returns:** _[Transaction](_transaction_.transaction.md)_

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹string›_

Signs and sends the given transaction object.

**Parameters:**

| Name    | Type                                                  | Description             |
| ------- | ----------------------------------------------------- | ----------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) | Raw transaction object. |

**Returns:** _Promise‹string›_

---

### prepareContractTransaction

▸ **prepareContractTransaction**(`userAddress`: string, `contractAddress`: string, `contractName`: string, `functionName`: string, `args`: any[], `options`: [TxOptionsInternal](../interfaces/_typings_.txoptionsinternal.md)): _Promise‹[TxObjectInternal](../interfaces/_typings_.txobjectinternal.md)›_

Returns transaction fees and the raw transaction object for calling a contract function.

**Parameters:**

| Name              | Type                                                              | Default | Description                                        |
| ----------------- | ----------------------------------------------------------------- | ------- | -------------------------------------------------- |
| `userAddress`     | string                                                            | -       | address of user that calls the contract function   |
| `contractAddress` | string                                                            | -       | address of deployed contract                       |
| `contractName`    | string                                                            | -       | name of deployed contract                          |
| `functionName`    | string                                                            | -       | name of contract function                          |
| `args`            | any[]                                                             | -       | arguments of function in same order as in contract |
| `options`         | [TxOptionsInternal](../interfaces/_typings_.txoptionsinternal.md) | {}      | -                                                  |

**Returns:** _Promise‹[TxObjectInternal](../interfaces/_typings_.txobjectinternal.md)›_

An ethereum transaction object and the estimated transaction fees in ETH.

---

### prepareValueTransaction

▸ **prepareValueTransaction**(`senderAddress`: string, `receiverAddress`: string, `rawValue`: BigNumber, `options`: [TxOptionsInternal](../interfaces/_typings_.txoptionsinternal.md)): _Promise‹[TxObjectInternal](../interfaces/_typings_.txobjectinternal.md)›_

Returns transaction fees and raw transaction object for transferring ETH.

**Parameters:**

| Name              | Type                                                              | Default | Description                            |
| ----------------- | ----------------------------------------------------------------- | ------- | -------------------------------------- |
| `senderAddress`   | string                                                            | -       | address of user sending the transfer   |
| `receiverAddress` | string                                                            | -       | address of user receiving the transfer |
| `rawValue`        | BigNumber                                                         | -       | transfer amount in wei                 |
| `options`         | [TxOptionsInternal](../interfaces/_typings_.txoptionsinternal.md) | {}      | -                                      |

**Returns:** _Promise‹[TxObjectInternal](../interfaces/_typings_.txobjectinternal.md)›_

An ethereum transaction object containing and the estimated transaction fees in ETH.
