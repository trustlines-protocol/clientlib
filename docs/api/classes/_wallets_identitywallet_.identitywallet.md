# Class: IdentityWallet

## Hierarchy

- **IdentityWallet**

## Implements

- [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)

## Index

### Constructors

- [constructor](_wallets_identitywallet_.identitywallet.md#constructor)

### Properties

- [provider](_wallets_identitywallet_.identitywallet.md#provider)

### Accessors

- [address](_wallets_identitywallet_.identitywallet.md#address)

### Methods

- [confirm](_wallets_identitywallet_.identitywallet.md#confirm)
- [create](_wallets_identitywallet_.identitywallet.md#create)
- [decrypt](_wallets_identitywallet_.identitywallet.md#decrypt)
- [deployIdentity](_wallets_identitywallet_.identitywallet.md#deployidentity)
- [encrypt](_wallets_identitywallet_.identitywallet.md#encrypt)
- [encryptToSerializedKeystore](_wallets_identitywallet_.identitywallet.md#encrypttoserializedkeystore)
- [exportPrivateKey](_wallets_identitywallet_.identitywallet.md#exportprivatekey)
- [getAddress](_wallets_identitywallet_.identitywallet.md#getaddress)
- [getBalance](_wallets_identitywallet_.identitywallet.md#getbalance)
- [getMetaTxFees](_wallets_identitywallet_.identitywallet.md#getmetatxfees)
- [getTxInfos](_wallets_identitywallet_.identitywallet.md#gettxinfos)
- [getWalletData](_wallets_identitywallet_.identitywallet.md#getwalletdata)
- [isIdentityDeployed](_wallets_identitywallet_.identitywallet.md#isidentitydeployed)
- [loadFrom](_wallets_identitywallet_.identitywallet.md#loadfrom)
- [recoverFromEncryptedKeystore](_wallets_identitywallet_.identitywallet.md#recoverfromencryptedkeystore)
- [recoverFromPrivateKey](_wallets_identitywallet_.identitywallet.md#recoverfromprivatekey)
- [recoverFromSeed](_wallets_identitywallet_.identitywallet.md#recoverfromseed)
- [showSeed](_wallets_identitywallet_.identitywallet.md#showseed)
- [signMessage](_wallets_identitywallet_.identitywallet.md#signmessage)
- [signMetaTransaction](_wallets_identitywallet_.identitywallet.md#signmetatransaction)
- [signMsgHash](_wallets_identitywallet_.identitywallet.md#signmsghash)

## Constructors

### constructor

\+ **new IdentityWallet**(`provider`: [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md), `chainId`: number, `__namedParameters`: object): _[IdentityWallet](_wallets_identitywallet_.identitywallet.md)_

**Parameters:**

▪ **provider**: _[TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

▪ **chainId**: _number_

▪ **\_\_namedParameters**: _object_

| Name                            | Type |
| ------------------------------- | ---- |
| `identityFactoryAddress`        | any  |
| `identityImplementationAddress` | any  |

**Returns:** _[IdentityWallet](_wallets_identitywallet_.identitywallet.md)_

## Properties

### provider

• **provider**: _[TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)_

## Accessors

### address

• **get address**(): _string_

**Returns:** _string_

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹string›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Takes a raw transaction object, turns it into a meta-transaction signed by
the loaded user and relays the transaction.

**Parameters:**

| Name    | Type                                                  | Description             |
| ------- | ----------------------------------------------------- | ----------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) | Raw transaction object. |

**Returns:** _Promise‹string›_

the hash of the meta-transaction

---

### create

▸ **create**(): _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Creates wallet data of type `identity`.

**Returns:** _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

---

### decrypt

▸ **decrypt**(`encMsg`: any, `theirPubKey`: string): _Promise‹any›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `encMsg`      | any    |
| `theirPubKey` | string |

**Returns:** _Promise‹any›_

---

### deployIdentity

▸ **deployIdentity**(): _Promise‹string›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Deploys a new identity contract on the chain

**Returns:** _Promise‹string›_

---

### encrypt

▸ **encrypt**(`msg`: string, `theirPubKey`: string): _Promise‹any›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `msg`         | string |
| `theirPubKey` | string |

**Returns:** _Promise‹any›_

---

### encryptToSerializedKeystore

▸ **encryptToSerializedKeystore**(`walletData`: [IdentityWalletData](../interfaces/_typings_.identitywalletdata.md), `password`: string, `progressCallback?`: function): _Promise‹string›_

Returns a serialized encrypted ethereum JSON keystore v3.

**Parameters:**

▪ **walletData**: _[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)_

Wallet data of type `identity`.

▪ **password**: _string_

Password to encrypt wallet data.

▪`Optional` **progressCallback**: _function_

Optional encryption progress callback.

▸ (`progress`: number): _any_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹string›_

---

### exportPrivateKey

▸ **exportPrivateKey**(): _Promise‹string›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Returns a `Promise` with the private key of loaded user.

**Returns:** _Promise‹string›_

---

### getAddress

▸ **getAddress**(): _Promise‹string›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Returns:** _Promise‹string›_

---

### getBalance

▸ **getBalance**(): _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Returns:** _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

---

### getMetaTxFees

▸ **getMetaTxFees**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹[MetaTransactionFees](../interfaces/_typings_.metatransactionfees.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Parameters:**

| Name    | Type                                                  |
| ------- | ----------------------------------------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) |

**Returns:** _Promise‹[MetaTransactionFees](../interfaces/_typings_.metatransactionfees.md)›_

---

### getTxInfos

▸ **getTxInfos**(`userAddress`: string): _Promise‹[TxInfos](../interfaces/_typings_.txinfos.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `userAddress` | string |

**Returns:** _Promise‹[TxInfos](../interfaces/_typings_.txinfos.md)›_

---

### getWalletData

▸ **getWalletData**(): _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Returns:** _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

---

### isIdentityDeployed

▸ **isIdentityDeployed**(): _Promise‹boolean›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Returns:** _Promise‹boolean›_

---

### loadFrom

▸ **loadFrom**(`walletData`: [IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)): _Promise‹void›_

Loads given wallet data of type `identity`.

**Parameters:**

| Name         | Type                                                                | Description                     |
| ------------ | ------------------------------------------------------------------- | ------------------------------- |
| `walletData` | [IdentityWalletData](../interfaces/_typings_.identitywalletdata.md) | Wallet data of type `identity`. |

**Returns:** _Promise‹void›_

---

### recoverFromEncryptedKeystore

▸ **recoverFromEncryptedKeystore**(`serializedEncryptedKeystore`: string, `password`: string, `progressCallback?`: function): _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

Recovers wallet data from a serialized encrypted ethereum JSON keystore v3
(e.g. as returned by `encryptToSerializedKeystore`).

**Parameters:**

▪ **serializedEncryptedKeystore**: _string_

Serialized encrypted ethereum JSON keystore v3.

▪ **password**: _string_

Password to decrypt serialized encrypted ethereum JSON keystore v3 with.

▪`Optional` **progressCallback**: _function_

Callback function for decryption progress.

▸ (`progress`: number): _any_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

---

### recoverFromPrivateKey

▸ **recoverFromPrivateKey**(`privateKey`: string): _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Recovers wallet data from private key.
Note that mnemonic and derivation path is `undefined` here.

**Parameters:**

| Name         | Type   | Description                              |
| ------------ | ------ | ---------------------------------------- |
| `privateKey` | string | Private key to recover wallet data from. |

**Returns:** _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

---

### recoverFromSeed

▸ **recoverFromSeed**(`seed`: string): _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Recovers wallet data from mnemonic phrase.

**Parameters:**

| Name   | Type   | Description           |
| ------ | ------ | --------------------- |
| `seed` | string | Mnemonic seed phrase. |

**Returns:** _Promise‹[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)›_

---

### showSeed

▸ **showSeed**(): _Promise‹string›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Returns a `Promise` with the mnemonic seed phrase of loaded user.

**Returns:** _Promise‹string›_

---

### signMessage

▸ **signMessage**(`message`: ethersUtils.Arrayish): _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

**Parameters:**

| Name      | Type                 |
| --------- | -------------------- |
| `message` | ethersUtils.Arrayish |

**Returns:** _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

---

### signMetaTransaction

▸ **signMetaTransaction**(`metaTransaction`: [MetaTransaction](../interfaces/_typings_.metatransaction.md)): _Promise‹string›_

**Parameters:**

| Name              | Type                                                          |
| ----------------- | ------------------------------------------------------------- |
| `metaTransaction` | [MetaTransaction](../interfaces/_typings_.metatransaction.md) |

**Returns:** _Promise‹string›_

---

### signMsgHash

▸ **signMsgHash**(`msgHash`: string): _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Parameters:**

| Name      | Type   |
| --------- | ------ |
| `msgHash` | string |

**Returns:** _Promise‹[Signature](../interfaces/_typings_.signature.md)›_
