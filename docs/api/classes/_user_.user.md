# Class: User

The [User](_user_.user.md) class contains all user related functions, which also include wallet related methods.
It is meant to be called via a [TLNetwork](_tlnetwork_.tlnetwork.md) instance like:

```typescript
const tlNetwork = new TLNetwork(...)

// Create user
tlNetwork.user.create().then(
 newUser => console.log("New user:", newUser)
)
```

## Hierarchy

- **User**

## Index

### Accessors

- [address](_user_.user.md#address)

### Methods

- [create](_user_.user.md#create)
- [createLink](_user_.user.md#createlink)
- [deployIdentity](_user_.user.md#deployidentity)
- [encryptToSerializedKeystore](_user_.user.md#encrypttoserializedkeystore)
- [exportPrivateKey](_user_.user.md#exportprivatekey)
- [getAddress](_user_.user.md#getaddress)
- [getBalance](_user_.user.md#getbalance)
- [getWalletData](_user_.user.md#getwalletdata)
- [isIdentityDeployed](_user_.user.md#isidentitydeployed)
- [loadFrom](_user_.user.md#loadfrom)
- [recoverFromEncryptedKeystore](_user_.user.md#recoverfromencryptedkeystore)
- [recoverFromPrivateKey](_user_.user.md#recoverfromprivatekey)
- [recoverFromSeed](_user_.user.md#recoverfromseed)
- [showSeed](_user_.user.md#showseed)
- [signMsgHash](_user_.user.md#signmsghash)

## Accessors

### address

• **get address**(): _string_

Checksummed Ethereum address of currently loaded user/wallet.

**Returns:** _string_

## Methods

### create

▸ **create**(): _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

Creates a new random wallet based on the configured [WalletType](../modules/_typings_.md#wallettype).

**Returns:** _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

the wallet data that can be used with `loadFrom`

---

### createLink

▸ **createLink**(`username`: string, `customBase?`: string): _string_

Returns a shareable link which can be send to other users.
Contains username and address.

**Parameters:**

| Name          | Type   | Description                                             |
| ------------- | ------ | ------------------------------------------------------- |
| `username`    | string | Custom username.                                        |
| `customBase?` | string | Optional custom base for link. Default `trustlines://`. |

**Returns:** _string_

---

### deployIdentity

▸ **deployIdentity**(): _Promise‹string›_

Deploys a new identity on the chain if the configured [WalletType](../modules/_typings_.md#wallettype) is [WalletTypeIdentity](../modules/_typings_.md#wallettypeidentity) and returns the transaction hash.

**Returns:** _Promise‹string›_

---

### encryptToSerializedKeystore

▸ **encryptToSerializedKeystore**(`tlWalletData`: [TLWalletData](../interfaces/_typings_.tlwalletdata.md), `password?`: string | function, `progressCallback?`: function): _Promise‹string›_

Encrypts and serializes the given wallet data.

**Parameters:**

▪ **tlWalletData**: _[TLWalletData](../interfaces/_typings_.tlwalletdata.md)_

Wallet data to encrypt and serialize.

▪`Optional` **password**: _string | function_

Optional password to encrypt wallet with.
If not specified default password is used.

▪`Optional` **progressCallback**: _function_

Optional encryption progress callback.

▸ (`progress`: number): _void_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹string›_

---

### exportPrivateKey

▸ **exportPrivateKey**(): _Promise‹string›_

Returns the private key of loaded user.

**Returns:** _Promise‹string›_

---

### getAddress

▸ **getAddress**(): _Promise‹string›_

Async `address` getter for loaded user.

**Returns:** _Promise‹string›_

---

### getBalance

▸ **getBalance**(): _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

Returns ETH balance of loaded user.

**Returns:** _Promise‹[Amount](../interfaces/_typings_.amount.md)›_

---

### getWalletData

▸ **getWalletData**(): _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

Returns the wallet data. Can be used with `loadFrom`

**Returns:** _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

---

### isIdentityDeployed

▸ **isIdentityDeployed**(): _Promise‹boolean›_

Returns a boolean if a new identity already has been deployed for the loaded user.

**Returns:** _Promise‹boolean›_

---

### loadFrom

▸ **loadFrom**(`tlWalletData`: [TLWalletData](../interfaces/_typings_.tlwalletdata.md)): _Promise‹void›_

Loads the given wallet data into the library

**Parameters:**

| Name           | Type                                                    | Description                |
| -------------- | ------------------------------------------------------- | -------------------------- |
| `tlWalletData` | [TLWalletData](../interfaces/_typings_.tlwalletdata.md) | data of the wallet to load |

**Returns:** _Promise‹void›_

---

### recoverFromEncryptedKeystore

▸ **recoverFromEncryptedKeystore**(`serializedEncryptedKeystore`: string, `password`: string, `progressCallback?`: function): _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

Recovers wallet data from a serialized encrypted JSON keystore string
(e.g. as returned by `encryptToSerializedKeystore`).

**Parameters:**

▪ **serializedEncryptedKeystore**: _string_

Serialized standard JSON keystore.

▪ **password**: _string_

Password to decrypt serialized JSON keystore with.

▪`Optional` **progressCallback**: _function_

Optional progress callback to call on encryption progress.

▸ (`progress`: number): _any_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

the wallet data. Can be used with `loadFrom`

---

### recoverFromPrivateKey

▸ **recoverFromPrivateKey**(`privateKey`: string): _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

Recovers wallet data from private key.

**Parameters:**

| Name         | Type   | Description                              |
| ------------ | ------ | ---------------------------------------- |
| `privateKey` | string | Private key to recover wallet data from. |

**Returns:** _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

wallet data. Can be used with `loadFrom`

---

### recoverFromSeed

▸ **recoverFromSeed**(`seed`: string): _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

Recovers wallet data from 12 word seed phrase.

**Parameters:**

| Name   | Type   | Description                 |
| ------ | ------ | --------------------------- |
| `seed` | string | 12 word seed phrase string. |

**Returns:** _Promise‹[TLWalletData](../interfaces/_typings_.tlwalletdata.md)›_

the wallet data. Can be used with `loadFrom`

---

### showSeed

▸ **showSeed**(): _Promise‹string›_

Returns the 12 word seed of loaded user.

**Returns:** _Promise‹string›_

---

### signMsgHash

▸ **signMsgHash**(`msgHash`: string): _Promise‹[Signature](../interfaces/_typings_.signature.md)›_

Digitally signs a message hash with the currently loaded user/wallet.

**Parameters:**

| Name      | Type   | Description                            |
| --------- | ------ | -------------------------------------- |
| `msgHash` | string | Hash of message that should be signed. |

**Returns:** _Promise‹[Signature](../interfaces/_typings_.signature.md)›_
