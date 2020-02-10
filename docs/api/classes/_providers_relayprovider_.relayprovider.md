# Class: RelayProvider

## Hierarchy

- **RelayProvider**

## Implements

- [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)

## Index

### Constructors

- [constructor](_providers_relayprovider_.relayprovider.md#constructor)

### Properties

- [relayApiUrl](_providers_relayprovider_.relayprovider.md#relayapiurl)
- [relayWsApiUrl](_providers_relayprovider_.relayprovider.md#relaywsapiurl)

### Methods

- [createWebsocketStream](_providers_relayprovider_.relayprovider.md#createwebsocketstream)
- [fetchEndpoint](_providers_relayprovider_.relayprovider.md#fetchendpoint)
- [getBalance](_providers_relayprovider_.relayprovider.md#getbalance)
- [getMetaTxFees](_providers_relayprovider_.relayprovider.md#getmetatxfees)
- [getMetaTxInfos](_providers_relayprovider_.relayprovider.md#getmetatxinfos)
- [getRelayVersion](_providers_relayprovider_.relayprovider.md#getrelayversion)
- [getTxInfos](_providers_relayprovider_.relayprovider.md#gettxinfos)
- [postToEndpoint](_providers_relayprovider_.relayprovider.md#posttoendpoint)
- [sendSignedMetaTransaction](_providers_relayprovider_.relayprovider.md#sendsignedmetatransaction)
- [sendSignedTransaction](_providers_relayprovider_.relayprovider.md#sendsignedtransaction)

## Constructors

### constructor

\+ **new RelayProvider**(`relayApiUrl`: string, `relayWsApiUrl`: string): _[RelayProvider](_providers_relayprovider_.relayprovider.md)_

**Parameters:**

| Name            | Type   |
| --------------- | ------ |
| `relayApiUrl`   | string |
| `relayWsApiUrl` | string |

**Returns:** _[RelayProvider](_providers_relayprovider_.relayprovider.md)_

## Properties

### relayApiUrl

• **relayApiUrl**: _string_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md).[relayApiUrl](../interfaces/_providers_tlprovider_.tlprovider.md#relayapiurl)_

---

### relayWsApiUrl

• **relayWsApiUrl**: _string_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md).[relayWsApiUrl](../interfaces/_providers_tlprovider_.tlprovider.md#relaywsapiurl)_

## Methods

### createWebsocketStream

▸ **createWebsocketStream**(`endpoint`: string, `functionName`: string, `args`: object, `reconnectingOptions?`: [ReconnectingWSOptions](../modules/_typings_.md#reconnectingwsoptions)): _Observable‹any›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Creates a websocket stream connection to the relay server.

**Parameters:**

| Name                   | Type                                                                   | Description                              |
| ---------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| `endpoint`             | string                                                                 | Websocket stream endpoint to connect to. |
| `functionName`         | string                                                                 | Function to call on connection.          |
| `args`                 | object                                                                 | Function arguments.                      |
| `reconnectingOptions?` | [ReconnectingWSOptions](../modules/_typings_.md#reconnectingwsoptions) | -                                        |

**Returns:** _Observable‹any›_

---

### fetchEndpoint

▸ **fetchEndpoint**<**T**>(`endpoint`: string, `options?`: object): _Promise‹T›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Returns a JSON response from the REST API of the relay server.

**Type parameters:**

▪ **T**

**Parameters:**

| Name       | Type   | Description             |
| ---------- | ------ | ----------------------- |
| `endpoint` | string | Endpoint to fetch.      |
| `options?` | object | Optional fetch options. |

**Returns:** _Promise‹T›_

---

### getBalance

▸ **getBalance**(`address`: string): _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Returns balance of given address.

**Parameters:**

| Name      | Type   | Description                       |
| --------- | ------ | --------------------------------- |
| `address` | string | Address to determine balance for. |

**Returns:** _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

---

### getMetaTxFees

▸ **getMetaTxFees**(`metaTransaction`: [MetaTransaction](../interfaces/_typings_.metatransaction.md)): _Promise‹[MetaTransactionFees](../interfaces/_typings_.metatransactionfees.md)›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Returns the fees the provider would be willing to pay for the transaction

**Parameters:**

| Name              | Type                                                          | Description                    |
| ----------------- | ------------------------------------------------------------- | ------------------------------ |
| `metaTransaction` | [MetaTransaction](../interfaces/_typings_.metatransaction.md) | Meta transaction to be relayed |

**Returns:** _Promise‹[MetaTransactionFees](../interfaces/_typings_.metatransactionfees.md)›_

The fees value and currency network of fees for given meta transaction

---

### getMetaTxInfos

▸ **getMetaTxInfos**(`address`: string): _Promise‹[TxInfos](../interfaces/_typings_.txinfos.md)›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Returns needed information for creating a meta transaction.

**Parameters:**

| Name      | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| `address` | string | Address of user creating the transaction |

**Returns:** _Promise‹[TxInfos](../interfaces/_typings_.txinfos.md)›_

Information for creating an ethereum transaction for the given identity address.
See type `TxInfos` for more details.

---

### getRelayVersion

▸ **getRelayVersion**(): _Promise‹string›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Returns the version of the currently configured relay server.

**Returns:** _Promise‹string›_

Version of relay in the format `<name>/vX.X.X`.

---

### getTxInfos

▸ **getTxInfos**(`address`: string): _Promise‹[TxInfos](../interfaces/_typings_.txinfos.md)›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Returns needed information for creating an ethereum transaction.

**Parameters:**

| Name      | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| `address` | string | Address of user creating the transaction |

**Returns:** _Promise‹[TxInfos](../interfaces/_typings_.txinfos.md)›_

Information for creating an ethereum transaction for the given user address.
See type `TxInfos` for more details.

---

### postToEndpoint

▸ **postToEndpoint**<**T**>(`endpoint`: string, `data`: any): _Promise‹T›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

**Type parameters:**

▪ **T**

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `endpoint` | string |
| `data`     | any    |

**Returns:** _Promise‹T›_

---

### sendSignedMetaTransaction

▸ **sendSignedMetaTransaction**(`signedMetaTransaction`: [MetaTransaction](../interfaces/_typings_.metatransaction.md)): _Promise‹string›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Send the given signed meta-transaction to a relay server to execute it on the
blockchain and returns a `Promise` with the transaction hash.

**Parameters:**

| Name                    | Type                                                          | Description                                            |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `signedMetaTransaction` | [MetaTransaction](../interfaces/_typings_.metatransaction.md) | Signed meta-transaction to be sent to the relay server |

**Returns:** _Promise‹string›_

The hash of the transaction sent by the relay server, not to be confused with the hash of the meta-transaction

---

### sendSignedTransaction

▸ **sendSignedTransaction**(`signedTransaction`: string): _Promise‹string›_

_Implementation of [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

Send the given _signedTransaction_ to a relay server to execute it on the
blockchain and returns a `Promise` with the transaction hash.

**Parameters:**

| Name                | Type   | Description |
| ------------------- | ------ | ----------- |
| `signedTransaction` | string |             |

**Returns:** _Promise‹string›_
