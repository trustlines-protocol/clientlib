# Class: EthWrapper

The class EthWrapper contains all methods for depositing, withdrawing and transferring wrapped ETH.

## Hierarchy

- **EthWrapper**

## Index

### Constructors

- [constructor](_ethwrapper_.ethwrapper.md#constructor)

### Methods

- [confirm](_ethwrapper_.ethwrapper.md#confirm)
- [getAddresses](_ethwrapper_.ethwrapper.md#getaddresses)
- [getBalance](_ethwrapper_.ethwrapper.md#getbalance)
- [getLogs](_ethwrapper_.ethwrapper.md#getlogs)
- [prepDeposit](_ethwrapper_.ethwrapper.md#prepdeposit)
- [prepTransfer](_ethwrapper_.ethwrapper.md#preptransfer)
- [prepWithdraw](_ethwrapper_.ethwrapper.md#prepwithdraw)

## Constructors

### constructor

\+ **new EthWrapper**(`params`: object): _[EthWrapper](_ethwrapper_.ethwrapper.md)_

**Parameters:**

▪ **params**: _object_

| Name          | Type                                                             |
| ------------- | ---------------------------------------------------------------- |
| `provider`    | [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md) |
| `transaction` | [Transaction](_transaction_.transaction.md)                      |
| `user`        | [User](_user_.user.md)                                           |

**Returns:** _[EthWrapper](_ethwrapper_.ethwrapper.md)_

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹string›_

Signs a raw transaction object as returned by `prepTransfer`, `prepDeposit` or `prepWithdraw`
and sends the signed transaction.

**Parameters:**

| Name    | Type                                                  | Description             |
| ------- | ----------------------------------------------------- | ----------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) | Raw transaction object. |

**Returns:** _Promise‹string›_

---

### getAddresses

▸ **getAddresses**(): _Promise‹string[]›_

Returns all known ETH wrapper contract addresses from the relay server.

**Returns:** _Promise‹string[]›_

---

### getBalance

▸ **getBalance**(`ethWrapperAddress`: string): _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

Returns the amount of already wrapped ETH on the given ETH wrapper contract.

**Parameters:**

| Name                | Type   | Description                      |
| ------------------- | ------ | -------------------------------- |
| `ethWrapperAddress` | string | Address of ETH wrapper contract. |

**Returns:** _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

---

### getLogs

▸ **getLogs**(`ethWrapperAddress`: string, `filter`: [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md)): _Promise‹[AnyTokenEvent](../modules/_typings_.md#anytokenevent)[]›_

Returns event logs of the ETH wrapper contract for the loaded user.

**Parameters:**

| Name                | Type                                                                | Default | Description                                                         |
| ------------------- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `ethWrapperAddress` | string                                                              | -       | Address of the ETH wrapper contract.                                |
| `filter`            | [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) | {}      | Event filter object. See `EventFilterOptions` for more information. |

**Returns:** _Promise‹[AnyTokenEvent](../modules/_typings_.md#anytokenevent)[]›_

---

### prepDeposit

▸ **prepDeposit**(`ethWrapperAddress`: string, `value`: number | string, `options`: [TxOptions](../interfaces/_typings_.txoptions.md)): _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

Prepares an ethereum transaction object for depositing/wrapping ETH.

**Parameters:**

| Name                | Type                                              | Default | Description                                                |
| ------------------- | ------------------------------------------------- | ------- | ---------------------------------------------------------- |
| `ethWrapperAddress` | string                                            | -       | Address of ETH wrapper contract.                           |
| `value`             | number &#124; string                              | -       | Amount of ETH to deposit/wrap.                             |
| `options`           | [TxOptions](../interfaces/_typings_.txoptions.md) | {}      | Transaction options. See `TxOptions` for more information. |

**Returns:** _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

---

### prepTransfer

▸ **prepTransfer**(`ethWrapperAddress`: string, `receiverAddress`: string, `value`: number | string, `options`: [TxOptions](../interfaces/_typings_.txoptions.md)): _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

Prepares an ethereum transaction object for transferring wrapped ETH where the
loaded user is the sender.

**Parameters:**

| Name                | Type                                              | Default | Description                                                |
| ------------------- | ------------------------------------------------- | ------- | ---------------------------------------------------------- |
| `ethWrapperAddress` | string                                            | -       | Address of ETH wrapper contract.                           |
| `receiverAddress`   | string                                            | -       | Address of receiver of transfer.                           |
| `value`             | number &#124; string                              | -       | Amount of wrapped ETH to transfer.                         |
| `options`           | [TxOptions](../interfaces/_typings_.txoptions.md) | {}      | Transaction options. See `TxOptions` for more information. |

**Returns:** _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

---

### prepWithdraw

▸ **prepWithdraw**(`ethWrapperAddress`: string, `value`: number | string, `options`: [TxOptions](../interfaces/_typings_.txoptions.md)): _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

Prepares an ethereum transaction object for withdrawing/unwrapping ETH.

**Parameters:**

| Name                | Type                                              | Default | Description                                                |
| ------------------- | ------------------------------------------------- | ------- | ---------------------------------------------------------- |
| `ethWrapperAddress` | string                                            | -       | Address of ETH wrapper contract.                           |
| `value`             | number &#124; string                              | -       | Amount of ETH to withdraw/unwrap.                          |
| `options`           | [TxOptions](../interfaces/_typings_.txoptions.md) | {}      | Transaction options. See `TxOptions` for more information. |

**Returns:** _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_
