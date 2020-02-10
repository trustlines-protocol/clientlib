# Class: Payment

The Payment class contains all payment related functions. This includes trustline transfers and TLC transfers.
It is meant to be called via a [TLNetwork](_tlnetwork_.tlnetwork.md) instance like:

```typescript
const tlNetwork = new TLNetwork()
//...

// Get transfer logs
tlNetwork.payment
  .get
  // ...
  ()
  .then(payments => console.log('Payments of loaded user:', payments))
```

## Hierarchy

- **Payment**

## Index

### Methods

- [confirm](_payment_.payment.md#confirm)
- [createRequest](_payment_.payment.md#createrequest)
- [get](_payment_.payment.md#get)
- [getMaxAmountAndPathInNetwork](_payment_.payment.md#getmaxamountandpathinnetwork)
- [getTransferPathInfo](_payment_.payment.md#gettransferpathinfo)
- [prepare](_payment_.payment.md#prepare)
- [prepareEth](_payment_.payment.md#prepareeth)

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹any›_

Signs a raw transaction object as returned by `prepare`
and sends the signed transaction.

**Parameters:**

| Name    | Type                                                  | Description             |
| ------- | ----------------------------------------------------- | ----------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) | Raw transaction object. |

**Returns:** _Promise‹any›_

---

### createRequest

▸ **createRequest**(`networkAddress`: string, `amount`: number, `subject`: string, `customBase?`: string): _Promise‹string›_

Creates a payment request link.

**Parameters:**

| Name             | Type   | Description                                             |
| ---------------- | ------ | ------------------------------------------------------- |
| `networkAddress` | string | Address of a currency network.                          |
| `amount`         | number | Requested transfer amount.                              |
| `subject`        | string | Additional information for payment request.             |
| `customBase?`    | string | Optional custom base for link. Default `trustlines://`. |

**Returns:** _Promise‹string›_

---

### get

▸ **get**(`networkAddress`: string, `filter`: [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md)): _Promise‹[NetworkTransferEvent](../interfaces/_typings_.networktransferevent.md)[]›_

Returns transfer event logs of loaded user in a specified currency network.

**Parameters:**

| Name             | Type                                                                | Default | Description                                                                                                        |
| ---------------- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `networkAddress` | string                                                              | -       | Address of currency network.                                                                                       |
| `filter`         | [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) | {}      | Event filter object. See [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) for more information. |

**Returns:** _Promise‹[NetworkTransferEvent](../interfaces/_typings_.networktransferevent.md)[]›_

---

### getMaxAmountAndPathInNetwork

▸ **getMaxAmountAndPathInNetwork**(`networkAddress`: string, `receiverAddress`: string): _Promise‹any›_

Retrieve the maximum spendable amount and path to user in a network

**Parameters:**

| Name              | Type   | Description |
| ----------------- | ------ | ----------- |
| `networkAddress`  | string | -           |
| `receiverAddress` | string |             |

**Returns:** _Promise‹any›_

> }

---

### getTransferPathInfo

▸ **getTransferPathInfo**(`networkAddress`: string, `senderAddress`: string, `receiverAddress`: string, `value`: number | string, `options`: [PaymentOptions](../interfaces/_typings_.paymentoptions.md)): _Promise‹[PathObject](../interfaces/_typings_.pathobject.md)›_

Returns a path for a trustlines transfer, along with estimated fees and gas costs.

**Parameters:**

| Name              | Type                                                        | Default | Description                                                                                            |
| ----------------- | ----------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `networkAddress`  | string                                                      | -       | Address of a currency network.                                                                         |
| `senderAddress`   | string                                                      | -       | Address of sender of transfer.                                                                         |
| `receiverAddress` | string                                                      | -       | Address of receiver of transfer.                                                                       |
| `value`           | number &#124; string                                        | -       | Amount to transfer in biggest unit, i.e. 1.23 if currency network has 2 decimals.                      |
| `options`         | [PaymentOptions](../interfaces/_typings_.paymentoptions.md) | {}      | Payment options. See [PaymentOptions](../interfaces/_typings_.paymentoptions.md) for more information. |

**Returns:** _Promise‹[PathObject](../interfaces/_typings_.pathobject.md)›_

---

### prepare

▸ **prepare**(`networkAddress`: string, `receiverAddress`: string, `value`: number | string, `options`: [PaymentOptions](../interfaces/_typings_.paymentoptions.md)): _Promise‹[PaymentTxObject](../interfaces/_typings_.paymenttxobject.md)›_

Prepares ethereum transaction object for a trustlines transfer, where loaded user is sender.

**Parameters:**

| Name              | Type                                                        | Default | Description                                                                                                     |
| ----------------- | ----------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `networkAddress`  | string                                                      | -       | Address of a currency network.                                                                                  |
| `receiverAddress` | string                                                      | -       | Address of receiver of transfer.                                                                                |
| `value`           | number &#124; string                                        | -       | Amount to transfer in biggest unit, i.e. 1.5 if currency network has 2 decimals.                                |
| `options`         | [PaymentOptions](../interfaces/_typings_.paymentoptions.md) | {}      | Optional payment options. See [PaymentOptions](../interfaces/_typings_.paymentoptions.md) for more information. |

**Returns:** _Promise‹[PaymentTxObject](../interfaces/_typings_.paymenttxobject.md)›_

---

### prepareEth

▸ **prepareEth**(`receiverAddress`: string, `value`: number | string, `options`: [PaymentOptions](../interfaces/_typings_.paymentoptions.md)): _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

Prepares a ethereum transaction object for a ETH transfer, where loaded user is the sender.

**Parameters:**

| Name              | Type                                                        | Default | Description                                                                                            |
| ----------------- | ----------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `receiverAddress` | string                                                      | -       | Address of receiver of transfer.                                                                       |
| `value`           | number &#124; string                                        | -       | Amount of ETH to transfer.                                                                             |
| `options`         | [PaymentOptions](../interfaces/_typings_.paymentoptions.md) | {}      | Payment options. See [PaymentOptions](../interfaces/_typings_.paymentoptions.md) for more information. |

**Returns:** _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_
