# Class: EthersWallet

The EthersWallet class contains wallet related methods.

## Hierarchy

- **EthersWallet**

## Implements

- [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)

## Index

### Constructors

- [constructor](_wallets_etherswallet_.etherswallet.md#constructor)

### Properties

- [provider](_wallets_etherswallet_.etherswallet.md#provider)

### Accessors

- [address](_wallets_etherswallet_.etherswallet.md#address)

### Methods

- [confirm](_wallets_etherswallet_.etherswallet.md#confirm)
- [create](_wallets_etherswallet_.etherswallet.md#create)
- [decrypt](_wallets_etherswallet_.etherswallet.md#decrypt)
- [deployIdentity](_wallets_etherswallet_.etherswallet.md#deployidentity)
- [encrypt](_wallets_etherswallet_.etherswallet.md#encrypt)
- [encryptToSerializedKeystore](_wallets_etherswallet_.etherswallet.md#encrypttoserializedkeystore)
- [exportPrivateKey](_wallets_etherswallet_.etherswallet.md#exportprivatekey)
- [getAddress](_wallets_etherswallet_.etherswallet.md#getaddress)
- [getBalance](_wallets_etherswallet_.etherswallet.md#getbalance)
- [getMetaTxFees](_wallets_etherswallet_.etherswallet.md#getmetatxfees)
- [getTxInfos](_wallets_etherswallet_.etherswallet.md#gettxinfos)
- [getWalletData](_wallets_etherswallet_.etherswallet.md#getwalletdata)
- [isIdentityDeployed](_wallets_etherswallet_.etherswallet.md#isidentitydeployed)
- [loadFrom](_wallets_etherswallet_.etherswallet.md#loadfrom)
- [recoverFromEncryptedKeystore](_wallets_etherswallet_.etherswallet.md#recoverfromencryptedkeystore)
- [recoverFromPrivateKey](_wallets_etherswallet_.etherswallet.md#recoverfromprivatekey)
- [recoverFromSeed](_wallets_etherswallet_.etherswallet.md#recoverfromseed)
- [showSeed](_wallets_etherswallet_.etherswallet.md#showseed)
- [signMessage](_wallets_etherswallet_.etherswallet.md#signmessage)
- [signMsgHash](_wallets_etherswallet_.etherswallet.md#signmsghash)

## Constructors

### constructor

\+ **new EthersWallet**(`provider`: [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md)): _[EthersWallet](_wallets_etherswallet_.etherswallet.md)_

**Parameters:**

| Name       | Type                                                             |
| ---------- | ---------------------------------------------------------------- |
| `provider` | [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md) |

**Returns:** _[EthersWallet](_wallets_etherswallet_.etherswallet.md)_

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

Takes a raw transaction object, turns it into a RLP encoded hex string, signs it with
the loaded user and relays the transaction.

**Parameters:**

| Name    | Type                                                  | Description             |
| ------- | ----------------------------------------------------- | ----------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) | Raw transaction object. |

**Returns:** _Promise‹string›_

---

### create

▸ **create**(): _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Creates wallet data of type `ethers`.

**Returns:** _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

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

▸ **encryptToSerializedKeystore**(`walletData`: [EthersWalletData](../interfaces/_typings_.etherswalletdata.md), `password`: string, `progressCallback?`: function): _Promise‹string›_

Encrypts and serializes the given wallet data.

**Parameters:**

▪ **walletData**: _[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)_

Wallet data of type `ethers`.

▪ **password**: _string_

Password to encrypt wallet data with.

▪`Optional` **progressCallback**: _function_

Optional encryption progress callback.

▸ (`progress`: number): _any_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹string›_

Serialized encrypted ethereum JSON keystore v3.

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

Returns a `Promise` with the balance of loaded user.

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

▸ **getWalletData**(): _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Returns:** _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

---

### isIdentityDeployed

▸ **isIdentityDeployed**(): _Promise‹boolean›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

**Returns:** _Promise‹boolean›_

---

### loadFrom

▸ **loadFrom**(`walletData`: [EthersWalletData](../interfaces/_typings_.etherswalletdata.md)): _Promise‹void›_

Loads given wallet data of type `ethers`.

**Parameters:**

| Name         | Type                                                            | Description                   |
| ------------ | --------------------------------------------------------------- | ----------------------------- |
| `walletData` | [EthersWalletData](../interfaces/_typings_.etherswalletdata.md) | Wallet data of type `ethers`. |

**Returns:** _Promise‹void›_

---

### recoverFromEncryptedKeystore

▸ **recoverFromEncryptedKeystore**(`serializedEncryptedKeystore`: string, `password`: string, `progressCallback?`: function): _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

Recovers wallet data from a serialized encrypted ethereum JSON keystore v3
(e.g. as returned by `encryptToSerializedKeystore`).

**Parameters:**

▪ **serializedEncryptedKeystore**: _string_

Serialized encrypted ethereum JSON keystore v3.

▪ **password**: _string_

Password to decrypt encrypted ethereum JSON keystore v3.

▪`Optional` **progressCallback**: _function_

Callback function for decryption progress.

▸ (`progress`: number): _any_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

---

### recoverFromPrivateKey

▸ **recoverFromPrivateKey**(`privateKey`: string): _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Recovers wallet data from private key.
Note that mnemonic and derivation path is `undefined` here.

**Parameters:**

| Name         | Type   | Description                              |
| ------------ | ------ | ---------------------------------------- |
| `privateKey` | string | Private key to recover wallet data from. |

**Returns:** _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

---

### recoverFromSeed

▸ **recoverFromSeed**(`seed`: string): _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Recovers wallet data from mnemonic phrase.

**Parameters:**

| Name   | Type   | Description           |
| ------ | ------ | --------------------- |
| `seed` | string | Mnemonic seed phrase. |

**Returns:** _Promise‹[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)›_

---

### showSeed

▸ **showSeed**(): _Promise‹string›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Returns a `Promise` with the mnemonic seed phrase of loaded user.
Note that the returned seed is `undefined` for accounts recovered by a private key
or serialized encrypted keystores that were not created with `ethers`.

**Returns:** _Promise‹string›_

---

### signMessage

▸ **signMessage**(`message`: ethersUtils.Arrayish): _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

Signs given message with loaded wallet.

**Parameters:**

| Name      | Type                 | Description      |
| --------- | -------------------- | ---------------- |
| `message` | ethersUtils.Arrayish | Message to sign. |

**Returns:** _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

---

### signMsgHash

▸ **signMsgHash**(`msgHash`: string): _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

_Implementation of [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)_

Signs given hex hash of message with loaded wallet.

**Parameters:**

| Name      | Type   | Description              |
| --------- | ------ | ------------------------ |
| `msgHash` | string | Hash of message to sign. |

**Returns:** _Promise‹[Signature](../interfaces/_typings_.signature.md)›_
