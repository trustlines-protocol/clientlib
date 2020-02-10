# Interface: TLWallet

Interface for different wallet strategies.

## Hierarchy

- [TLSigner](_signers_tlsigner_.tlsigner.md)

  ↳ **TLWallet**

## Implemented by

- [EthersWallet](../classes/_wallets_etherswallet_.etherswallet.md)
- [IdentityWallet](../classes/_wallets_identitywallet_.identitywallet.md)

## Index

### Properties

- [address](_wallets_tlwallet_.tlwallet.md#address)

### Methods

- [confirm](_wallets_tlwallet_.tlwallet.md#confirm)
- [create](_wallets_tlwallet_.tlwallet.md#create)
- [decrypt](_wallets_tlwallet_.tlwallet.md#decrypt)
- [deployIdentity](_wallets_tlwallet_.tlwallet.md#deployidentity)
- [encrypt](_wallets_tlwallet_.tlwallet.md#encrypt)
- [encryptToSerializedKeystore](_wallets_tlwallet_.tlwallet.md#encrypttoserializedkeystore)
- [exportPrivateKey](_wallets_tlwallet_.tlwallet.md#exportprivatekey)
- [getAddress](_wallets_tlwallet_.tlwallet.md#getaddress)
- [getBalance](_wallets_tlwallet_.tlwallet.md#getbalance)
- [getMetaTxFees](_wallets_tlwallet_.tlwallet.md#getmetatxfees)
- [getTxInfos](_wallets_tlwallet_.tlwallet.md#gettxinfos)
- [getWalletData](_wallets_tlwallet_.tlwallet.md#getwalletdata)
- [isIdentityDeployed](_wallets_tlwallet_.tlwallet.md#isidentitydeployed)
- [loadFrom](_wallets_tlwallet_.tlwallet.md#loadfrom)
- [recoverFromEncryptedKeystore](_wallets_tlwallet_.tlwallet.md#recoverfromencryptedkeystore)
- [recoverFromPrivateKey](_wallets_tlwallet_.tlwallet.md#recoverfromprivatekey)
- [recoverFromSeed](_wallets_tlwallet_.tlwallet.md#recoverfromseed)
- [showSeed](_wallets_tlwallet_.tlwallet.md#showseed)
- [signMessage](_wallets_tlwallet_.tlwallet.md#signmessage)
- [signMsgHash](_wallets_tlwallet_.tlwallet.md#signmsghash)

## Properties

### address

• **address**: _string_

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](_typings_.rawtxobject.md)): _Promise‹string›_

_Inherited from [TLSigner](_signers_tlsigner_.tlsigner.md).[confirm](_signers_tlsigner_.tlsigner.md#confirm)_

**Parameters:**

| Name    | Type                                    |
| ------- | --------------------------------------- |
| `rawTx` | [RawTxObject](_typings_.rawtxobject.md) |

**Returns:** _Promise‹string›_

---

### create

▸ **create**(): _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

**Returns:** _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

---

### decrypt

▸ **decrypt**(`encMsg`: any, `theirPubKey`: string): _Promise‹any›_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `encMsg`      | any    |
| `theirPubKey` | string |

**Returns:** _Promise‹any›_

---

### deployIdentity

▸ **deployIdentity**(): _Promise‹string›_

**Returns:** _Promise‹string›_

---

### encrypt

▸ **encrypt**(`msg`: string, `theirPubKey`: string): _Promise‹any›_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `msg`         | string |
| `theirPubKey` | string |

**Returns:** _Promise‹any›_

---

### encryptToSerializedKeystore

▸ **encryptToSerializedKeystore**(`tlWalletData`: [TLWalletData](_typings_.tlwalletdata.md), `password`: string, `progressCallback?`: function): _Promise‹string›_

**Parameters:**

▪ **tlWalletData**: _[TLWalletData](_typings_.tlwalletdata.md)_

▪ **password**: _string_

▪`Optional` **progressCallback**: _function_

▸ (`progress`: number): _any_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹string›_

---

### exportPrivateKey

▸ **exportPrivateKey**(): _Promise‹string›_

**Returns:** _Promise‹string›_

---

### getAddress

▸ **getAddress**(): _Promise‹string›_

_Overrides [TLSigner](_signers_tlsigner_.tlsigner.md).[getAddress](_signers_tlsigner_.tlsigner.md#getaddress)_

**Returns:** _Promise‹string›_

---

### getBalance

▸ **getBalance**(): _Promise‹[Amount](_typings_.amount.md)›_

_Inherited from [TLSigner](_signers_tlsigner_.tlsigner.md).[getBalance](_signers_tlsigner_.tlsigner.md#getbalance)_

**Returns:** _Promise‹[Amount](_typings_.amount.md)›_

---

### getMetaTxFees

▸ **getMetaTxFees**(`rawTx`: [RawTxObject](_typings_.rawtxobject.md)): _Promise‹[MetaTransactionFees](_typings_.metatransactionfees.md)›_

_Inherited from [TLSigner](_signers_tlsigner_.tlsigner.md).[getMetaTxFees](_signers_tlsigner_.tlsigner.md#getmetatxfees)_

**Parameters:**

| Name    | Type                                    |
| ------- | --------------------------------------- |
| `rawTx` | [RawTxObject](_typings_.rawtxobject.md) |

**Returns:** _Promise‹[MetaTransactionFees](_typings_.metatransactionfees.md)›_

---

### getTxInfos

▸ **getTxInfos**(`userAddress`: string): _Promise‹[TxInfos](_typings_.txinfos.md)›_

_Inherited from [TLSigner](_signers_tlsigner_.tlsigner.md).[getTxInfos](_signers_tlsigner_.tlsigner.md#gettxinfos)_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `userAddress` | string |

**Returns:** _Promise‹[TxInfos](_typings_.txinfos.md)›_

---

### getWalletData

▸ **getWalletData**(): _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

**Returns:** _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

---

### isIdentityDeployed

▸ **isIdentityDeployed**(): _Promise‹boolean›_

**Returns:** _Promise‹boolean›_

---

### loadFrom

▸ **loadFrom**(`tlWalletData`: [TLWalletData](_typings_.tlwalletdata.md)): _Promise‹void›_

**Parameters:**

| Name           | Type                                      |
| -------------- | ----------------------------------------- |
| `tlWalletData` | [TLWalletData](_typings_.tlwalletdata.md) |

**Returns:** _Promise‹void›_

---

### recoverFromEncryptedKeystore

▸ **recoverFromEncryptedKeystore**(`serializedEncryptedKeystore`: string, `password`: string, `progressCallback?`: function): _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

**Parameters:**

▪ **serializedEncryptedKeystore**: _string_

▪ **password**: _string_

▪`Optional` **progressCallback**: _function_

▸ (`progress`: number): _any_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

---

### recoverFromPrivateKey

▸ **recoverFromPrivateKey**(`privateKey`: string): _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

**Parameters:**

| Name         | Type   |
| ------------ | ------ |
| `privateKey` | string |

**Returns:** _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

---

### recoverFromSeed

▸ **recoverFromSeed**(`seed`: string): _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

**Parameters:**

| Name   | Type   |
| ------ | ------ |
| `seed` | string |

**Returns:** _Promise‹[TLWalletData](_typings_.tlwalletdata.md)›_

---

### showSeed

▸ **showSeed**(): _Promise‹string›_

**Returns:** _Promise‹string›_

---

### signMessage

▸ **signMessage**(`message`: string | ArrayLike‹number›): _Promise‹[Signature](_typings_.signature.md)›_

_Inherited from [TLSigner](_signers_tlsigner_.tlsigner.md).[signMessage](_signers_tlsigner_.tlsigner.md#signmessage)_

**Parameters:**

| Name      | Type                            |
| --------- | ------------------------------- |
| `message` | string &#124; ArrayLike‹number› |

**Returns:** _Promise‹[Signature](_typings_.signature.md)›_

---

### signMsgHash

▸ **signMsgHash**(`msgHash`: string): _Promise‹[Signature](_typings_.signature.md)›_

_Inherited from [TLSigner](_signers_tlsigner_.tlsigner.md).[signMsgHash](_signers_tlsigner_.tlsigner.md#signmsghash)_

**Parameters:**

| Name      | Type   |
| --------- | ------ |
| `msgHash` | string |

**Returns:** _Promise‹[Signature](_typings_.signature.md)›_
