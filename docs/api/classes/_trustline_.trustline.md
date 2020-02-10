# Class: Trustline

The [Trustline](_trustline_.trustline.md) class contains all relevant methods for retrieving, creating and editing trustlines.
It is meant to be called via a [TLNetwork](_tlnetwork_.tlnetwork.md) instance like:

```typescript
const tlNetwork = new TLNetwork()
//...

// Get trustlines
tlNetwork.trustline
  .getAll
  // ...
  ()
  .then(trustlines => console.log('Trustlines of loaded user:', trustlines))
```

## Hierarchy

- **Trustline**

## Index

### Methods

- [confirm](_trustline_.trustline.md#confirm)
- [get](_trustline_.trustline.md#get)
- [getAll](_trustline_.trustline.md#getall)
- [getAllOfUser](_trustline_.trustline.md#getallofuser)
- [getClosePath](_trustline_.trustline.md#getclosepath)
- [getRequests](_trustline_.trustline.md#getrequests)
- [getTrustlineUpdateCancels](_trustline_.trustline.md#gettrustlineupdatecancels)
- [getUpdates](_trustline_.trustline.md#getupdates)
- [prepareAccept](_trustline_.trustline.md#prepareaccept)
- [prepareCancelTrustlineUpdate](_trustline_.trustline.md#preparecanceltrustlineupdate)
- [prepareClose](_trustline_.trustline.md#prepareclose)
- [prepareUpdate](_trustline_.trustline.md#prepareupdate)

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹any›_

Signs a raw transaction object as returned by `prepareAccept` or `prepareUpdate`
and sends the signed transaction.

**Parameters:**

| Name    | Type                                                  | Description             |
| ------- | ----------------------------------------------------- | ----------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) | Raw transaction object. |

**Returns:** _Promise‹any›_

---

### get

▸ **get**(`networkAddress`: string, `counterpartyAddress`: string, `options`: object): _Promise‹[TrustlineObject](../interfaces/_typings_.trustlineobject.md)›_

Returns a trustline to a counterparty address in a specified currency network.

**Parameters:**

▪ **networkAddress**: _string_

Address of a currency network.

▪ **counterpartyAddress**: _string_

Address of counterparty of trustline.

▪`Default value` **options**: _object_= {}

| Name               | Type                                                          |
| ------------------ | ------------------------------------------------------------- |
| `decimalsOptions?` | [DecimalsOptions](../interfaces/_typings_.decimalsoptions.md) |

**Returns:** _Promise‹[TrustlineObject](../interfaces/_typings_.trustlineobject.md)›_

---

### getAll

▸ **getAll**(`networkAddress`: string, `options`: object): _Promise‹[TrustlineObject](../interfaces/_typings_.trustlineobject.md)[]›_

Returns all trustlines of a loaded user in a currency network.

**Parameters:**

▪ **networkAddress**: _string_

Address of a currency network.

▪`Default value` **options**: _object_= {}

Extra options for user, network or trustline.

| Name               | Type                                                          |
| ------------------ | ------------------------------------------------------------- |
| `decimalsOptions?` | [DecimalsOptions](../interfaces/_typings_.decimalsoptions.md) |

**Returns:** _Promise‹[TrustlineObject](../interfaces/_typings_.trustlineobject.md)[]›_

---

### getAllOfUser

▸ **getAllOfUser**(): _Promise‹[TrustlineObject](../interfaces/_typings_.trustlineobject.md)[]›_

Returns all trustlines of a loaded user in all currency networks.

**Returns:** _Promise‹[TrustlineObject](../interfaces/_typings_.trustlineobject.md)[]›_

---

### getClosePath

▸ **getClosePath**(`networkAddress`: string, `senderAddress`: string, `counterpartyAddress`: string, `options`: [PaymentOptions](../interfaces/_typings_.paymentoptions.md)): _Promise‹[ClosePathObject](../interfaces/_typings_.closepathobject.md)›_

Returns a path for closing a trustline between sender and counterparty.

**Parameters:**

| Name                  | Type                                                        | Default | Description                                                                                            |
| --------------------- | ----------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `networkAddress`      | string                                                      | -       | Address of a currency network.                                                                         |
| `senderAddress`       | string                                                      | -       | Address of sender.                                                                                     |
| `counterpartyAddress` | string                                                      | -       | Address of counterparty of trustline.                                                                  |
| `options`             | [PaymentOptions](../interfaces/_typings_.paymentoptions.md) | {}      | Payment options. See [PaymentOptions](../interfaces/_typings_.paymentoptions.md) for more information. |

**Returns:** _Promise‹[ClosePathObject](../interfaces/_typings_.closepathobject.md)›_

Relevant information for closing a trustline. See `ClosePathObject`.

---

### getRequests

▸ **getRequests**(`networkAddress`: string, `filter`: [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md)): _Promise‹[NetworkTrustlineEvent](../interfaces/_typings_.networktrustlineevent.md)[]›_

Returns trustline update requests of loaded user in a currency network.

**Parameters:**

| Name             | Type                                                                | Default | Description                                                         |
| ---------------- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `networkAddress` | string                                                              | -       | Address of a currency network.                                      |
| `filter`         | [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) | {}      | Event filter object. See `EventFilterOptions` for more information. |

**Returns:** _Promise‹[NetworkTrustlineEvent](../interfaces/_typings_.networktrustlineevent.md)[]›_

---

### getTrustlineUpdateCancels

▸ **getTrustlineUpdateCancels**(`networkAddress`: string, `filter`: [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md)): _Promise‹[NetworkEvent](../interfaces/_typings_.networkevent.md)[]›_

Returns trustline update cancels of loaded user in a currency network.

**Parameters:**

| Name             | Type                                                                | Default | Description                                                         |
| ---------------- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `networkAddress` | string                                                              | -       | Address of a currency network.                                      |
| `filter`         | [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) | {}      | Event filter object. See `EventFilterOptions` for more information. |

**Returns:** _Promise‹[NetworkEvent](../interfaces/_typings_.networkevent.md)[]›_

---

### getUpdates

▸ **getUpdates**(`networkAddress`: string, `filter`: [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md)): _Promise‹[NetworkTrustlineEvent](../interfaces/_typings_.networktrustlineevent.md)[]›_

Returns trustline updates of loaded user in a currency network. An update
happens when a user accepts a trustline update request.

**Parameters:**

| Name             | Type                                                                | Default | Description                                                         |
| ---------------- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `networkAddress` | string                                                              | -       | Address of a currency network.                                      |
| `filter`         | [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) | {}      | Event filter object. See `EventFilterOptions` for more information. |

**Returns:** _Promise‹[NetworkTrustlineEvent](../interfaces/_typings_.networktrustlineevent.md)[]›_

---

### prepareAccept

▸ **prepareAccept**(`networkAddress`: string, `initiatorAddress`: string, `creditlineGiven`: number | string, `creditlineReceived`: number | string, `options`: [TrustlineUpdateOptions](../interfaces/_typings_.trustlineupdateoptions.md)): _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

Prepares a transaction object for accepting a trustline update request. Called
by receiver of initial update request.

**Parameters:**

| Name                 | Type                                                                        | Default | Description                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `networkAddress`     | string                                                                      | -       | Address of a currency network.                                                                                                                          |
| `initiatorAddress`   | string                                                                      | -       | Address of user who initiated the trustline update request.                                                                                             |
| `creditlineGiven`    | number &#124; string                                                        | -       | Proposed creditline limit given by receiver to initiator, i.e. 1.23 if network has to 2 decimals.                                                       |
| `creditlineReceived` | number &#124; string                                                        | -       | Proposed creditline limit received by initiator from receiver, i.e. 1.23 if network has to 2 decimals.                                                  |
| `options`            | [TrustlineUpdateOptions](../interfaces/_typings_.trustlineupdateoptions.md) | {}      | Options for creating a ethereum transaction. See type [TrustlineUpdateOptions](../interfaces/_typings_.trustlineupdateoptions.md) for more information. |

**Returns:** _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

---

### prepareCancelTrustlineUpdate

▸ **prepareCancelTrustlineUpdate**(`networkAddress`: string, `counterpartyAddress`: string, `options`: [TxOptions](../interfaces/_typings_.txoptions.md)): _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

Prepares a transaction object for canceling / rejecting a trustline update request.
Called by initiator of cancel.

**Parameters:**

| Name                  | Type                                              | Default | Description                                                                                                                |
| --------------------- | ------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `networkAddress`      | string                                            | -       | Address of a currency network.                                                                                             |
| `counterpartyAddress` | string                                            | -       | Address of counterparty to cancel / reject the trustline update with.                                                      |
| `options`             | [TxOptions](../interfaces/_typings_.txoptions.md) | {}      | Options for creating the ethereum transaction. See [TxOptions](../interfaces/_typings_.txoptions.md) for more information. |

**Returns:** _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

---

### prepareClose

▸ **prepareClose**(`networkAddress`: string, `counterpartyAddress`: string, `options`: [PaymentOptions](../interfaces/_typings_.paymentoptions.md)): _Promise‹[CloseTxObject](../interfaces/_typings_.closetxobject.md)›_

Prepares an ethereum transaction object for closing a trustline.

**Parameters:**

| Name                  | Type                                                        | Default | Description                                                                                            |
| --------------------- | ----------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `networkAddress`      | string                                                      | -       | Address of a currency network.                                                                         |
| `counterpartyAddress` | string                                                      | -       | Address of counterparty to who the trustline should be settled.                                        |
| `options`             | [PaymentOptions](../interfaces/_typings_.paymentoptions.md) | {}      | Payment options. See [PaymentOptions](../interfaces/_typings_.paymentoptions.md) for more information. |

**Returns:** _Promise‹[CloseTxObject](../interfaces/_typings_.closetxobject.md)›_

A transaction object for closing a trustline. See `CloseTxObject` for more information.

---

### prepareUpdate

▸ **prepareUpdate**(`networkAddress`: string, `counterpartyAddress`: string, `creditlineGiven`: number | string, `creditlineReceived`: number | string, `options`: [TrustlineUpdateOptions](../interfaces/_typings_.trustlineupdateoptions.md)): _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

Prepares a transaction object for creating a trustline update request.
Called by initiator of update request.

**Parameters:**

| Name                  | Type                                                                        | Default | Description                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `networkAddress`      | string                                                                      | -       | Address of a currency network.                                                                                                                                             |
| `counterpartyAddress` | string                                                                      | -       | Address of counterparty who receives trustline update request.                                                                                                             |
| `creditlineGiven`     | number &#124; string                                                        | -       | Proposed creditline limit given by initiator to counterparty, i.e. 1.23 if network has to 2 decimals.                                                                      |
| `creditlineReceived`  | number &#124; string                                                        | -       | Proposed creditline limit received by initiator from counterparty, i.e. 1.23 if network has to 2 decimals.                                                                 |
| `options`             | [TrustlineUpdateOptions](../interfaces/_typings_.trustlineupdateoptions.md) | {}      | Options for creating an `updateTrustline` ethereum transaction. See type [TrustlineUpdateOptions](../interfaces/_typings_.trustlineupdateoptions.md) for more information. |

**Returns:** _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_
