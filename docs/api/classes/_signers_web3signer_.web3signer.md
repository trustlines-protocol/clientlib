# Class: Web3Signer

The Web3Signer class contains functions for signing transactions with a web3 provider.

## Hierarchy

- **Web3Signer**

## Implements

- [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)

## Index

### Constructors

- [constructor](_signers_web3signer_.web3signer.md#constructor)

### Properties

- [address](_signers_web3signer_.web3signer.md#address)

### Methods

- [confirm](_signers_web3signer_.web3signer.md#confirm)
- [getAddress](_signers_web3signer_.web3signer.md#getaddress)
- [getBalance](_signers_web3signer_.web3signer.md#getbalance)
- [getMetaTxFees](_signers_web3signer_.web3signer.md#getmetatxfees)
- [getTxInfos](_signers_web3signer_.web3signer.md#gettxinfos)
- [signMessage](_signers_web3signer_.web3signer.md#signmessage)
- [signMsgHash](_signers_web3signer_.web3signer.md#signmsghash)

## Constructors

### constructor

\+ **new Web3Signer**(`web3Provider`: Web3Provider): _[Web3Signer](_signers_web3signer_.web3signer.md)_

**Parameters:**

| Name           | Type         |
| -------------- | ------------ |
| `web3Provider` | Web3Provider |

**Returns:** _[Web3Signer](_signers_web3signer_.web3signer.md)_

## Properties

### address

• **address**: _string_

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹string›_

_Implementation of [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)_

Signs a transaction and returns `Promise` with transaction hash.

**Parameters:**

| Name    | Type                                                  | Description             |
| ------- | ----------------------------------------------------- | ----------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) | Raw transaction object. |

**Returns:** _Promise‹string›_

---

### getAddress

▸ **getAddress**(): _Promise‹string›_

_Implementation of [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)_

Returns `Promise` with address of signer.

**Returns:** _Promise‹string›_

---

### getBalance

▸ **getBalance**(): _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

_Implementation of [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)_

Returns `Promise` with balance of signer.

**Returns:** _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

---

### getMetaTxFees

▸ **getMetaTxFees**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹[MetaTransactionFees](../interfaces/_typings_.metatransactionfees.md)›_

_Implementation of [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)_

**Parameters:**

| Name    | Type                                                  |
| ------- | ----------------------------------------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) |

**Returns:** _Promise‹[MetaTransactionFees](../interfaces/_typings_.metatransactionfees.md)›_

---

### getTxInfos

▸ **getTxInfos**(`userAddress`: string): _Promise‹[TxInfos](../interfaces/_typings_.txinfos.md)›_

_Implementation of [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `userAddress` | string |

**Returns:** _Promise‹[TxInfos](../interfaces/_typings_.txinfos.md)›_

---

### signMessage

▸ **signMessage**(`message`: string | ArrayLike‹number›): _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

_Implementation of [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)_

Signs the given message and returns `Promise` with signature.

**Parameters:**

| Name      | Type                            | Description      |
| --------- | ------------------------------- | ---------------- |
| `message` | string &#124; ArrayLike‹number› | Message to sign. |

**Returns:** _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

---

### signMsgHash

▸ **signMsgHash**(`msgHash`: string): _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

_Implementation of [TLSigner](../interfaces/_signers_tlsigner_.tlsigner.md)_

Signs the given message hash and return `Promise` with signature.

**Parameters:**

| Name      | Type   | Description              |
| --------- | ------ | ------------------------ |
| `msgHash` | string | Hash of message to sign. |

**Returns:** _Promise‹[Signature](../interfaces/_typings_.signature.md)›_
