# Interface: TLProvider

Interface for different provider strategies which extends the given
abstract class of `ethers.js`.

## Hierarchy

- **TLProvider**

## Implemented by

- [RelayProvider](../classes/_providers_relayprovider_.relayprovider.md)

## Index

### Properties

- [relayApiUrl](_providers_tlprovider_.tlprovider.md#relayapiurl)
- [relayWsApiUrl](_providers_tlprovider_.tlprovider.md#relaywsapiurl)

### Methods

- [createWebsocketStream](_providers_tlprovider_.tlprovider.md#createwebsocketstream)
- [fetchEndpoint](_providers_tlprovider_.tlprovider.md#fetchendpoint)
- [getBalance](_providers_tlprovider_.tlprovider.md#getbalance)
- [getMetaTxFees](_providers_tlprovider_.tlprovider.md#getmetatxfees)
- [getMetaTxInfos](_providers_tlprovider_.tlprovider.md#getmetatxinfos)
- [getRelayVersion](_providers_tlprovider_.tlprovider.md#getrelayversion)
- [getTxInfos](_providers_tlprovider_.tlprovider.md#gettxinfos)
- [postToEndpoint](_providers_tlprovider_.tlprovider.md#posttoendpoint)
- [sendSignedMetaTransaction](_providers_tlprovider_.tlprovider.md#sendsignedmetatransaction)
- [sendSignedTransaction](_providers_tlprovider_.tlprovider.md#sendsignedtransaction)

## Properties

### relayApiUrl

• **relayApiUrl**: _string_

---

### relayWsApiUrl

• **relayWsApiUrl**: _string_

## Methods

### createWebsocketStream

▸ **createWebsocketStream**(`endpoint`: string, `functionName`: string, `args`: object, `reconnectingOptions?`: [ReconnectingWSOptions](../modules/_typings_.md#reconnectingwsoptions)): _any_

**Parameters:**

| Name                   | Type                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| `endpoint`             | string                                                                 |
| `functionName`         | string                                                                 |
| `args`                 | object                                                                 |
| `reconnectingOptions?` | [ReconnectingWSOptions](../modules/_typings_.md#reconnectingwsoptions) |

**Returns:** _any_

---

### fetchEndpoint

▸ **fetchEndpoint**<**T**>(`endpoint`: string, `options?`: object): _Promise‹T›_

**Type parameters:**

▪ **T**

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `endpoint` | string |
| `options?` | object |

**Returns:** _Promise‹T›_

---

### getBalance

▸ **getBalance**(`userAddress`: string): _Promise‹[Amount](_typings_.amount.md)›_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `userAddress` | string |

**Returns:** _Promise‹[Amount](_typings_.amount.md)›_

---

### getMetaTxFees

▸ **getMetaTxFees**(`metaTransaction`: [MetaTransaction](_typings_.metatransaction.md)): _Promise‹[MetaTransactionFees](_typings_.metatransactionfees.md)›_

**Parameters:**

| Name              | Type                                            |
| ----------------- | ----------------------------------------------- |
| `metaTransaction` | [MetaTransaction](_typings_.metatransaction.md) |

**Returns:** _Promise‹[MetaTransactionFees](_typings_.metatransactionfees.md)›_

---

### getMetaTxInfos

▸ **getMetaTxInfos**(`userAddress`: string): _Promise‹[TxInfos](_typings_.txinfos.md)›_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `userAddress` | string |

**Returns:** _Promise‹[TxInfos](_typings_.txinfos.md)›_

---

### getRelayVersion

▸ **getRelayVersion**(): _Promise‹string›_

**Returns:** _Promise‹string›_

---

### getTxInfos

▸ **getTxInfos**(`userAddress`: string): _Promise‹[TxInfos](_typings_.txinfos.md)›_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `userAddress` | string |

**Returns:** _Promise‹[TxInfos](_typings_.txinfos.md)›_

---

### postToEndpoint

▸ **postToEndpoint**<**T**>(`endpoint`: string, `data`: any): _Promise‹T›_

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

▸ **sendSignedMetaTransaction**(`metaTransaction`: [MetaTransaction](_typings_.metatransaction.md)): _Promise‹string›_

**Parameters:**

| Name              | Type                                            |
| ----------------- | ----------------------------------------------- |
| `metaTransaction` | [MetaTransaction](_typings_.metatransaction.md) |

**Returns:** _Promise‹string›_

---

### sendSignedTransaction

▸ **sendSignedTransaction**(`signedTransaction`: string): _Promise‹string›_

**Parameters:**

| Name                | Type   |
| ------------------- | ------ |
| `signedTransaction` | string |

**Returns:** _Promise‹string›_
