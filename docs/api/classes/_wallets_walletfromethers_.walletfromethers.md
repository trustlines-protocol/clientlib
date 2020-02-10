# Class: WalletFromEthers

This is a wrapper class for `ethers.Wallet`. It allows us to customize some of the methods provided by
`ethers.Wallet`. We also use this to add some conversion methods adapted to our internal types.

## Hierarchy

- Wallet

  ↳ **WalletFromEthers**

## Index

### Constructors

- [constructor](_wallets_walletfromethers_.walletfromethers.md#constructor)

### Properties

- [address](_wallets_walletfromethers_.walletfromethers.md#address)
- [mnemonic](_wallets_walletfromethers_.walletfromethers.md#mnemonic)
- [path](_wallets_walletfromethers_.walletfromethers.md#path)
- [privateKey](_wallets_walletfromethers_.walletfromethers.md#privatekey)
- [provider](_wallets_walletfromethers_.walletfromethers.md#provider)

### Methods

- [connect](_wallets_walletfromethers_.walletfromethers.md#connect)
- [encrypt](_wallets_walletfromethers_.walletfromethers.md#encrypt)
- [getAddress](_wallets_walletfromethers_.walletfromethers.md#getaddress)
- [getBalance](_wallets_walletfromethers_.walletfromethers.md#getbalance)
- [getTransactionCount](_wallets_walletfromethers_.walletfromethers.md#gettransactioncount)
- [sendTransaction](_wallets_walletfromethers_.walletfromethers.md#sendtransaction)
- [sign](_wallets_walletfromethers_.walletfromethers.md#sign)
- [signMessage](_wallets_walletfromethers_.walletfromethers.md#signmessage)
- [toEthersWalletData](_wallets_walletfromethers_.walletfromethers.md#toetherswalletdata)
- [toIdentityWalletData](_wallets_walletfromethers_.walletfromethers.md#toidentitywalletdata)
- [createRandom](_wallets_walletfromethers_.walletfromethers.md#static-createrandom)
- [fromEncryptedJson](_wallets_walletfromethers_.walletfromethers.md#static-fromencryptedjson)
- [fromMnemonic](_wallets_walletfromethers_.walletfromethers.md#static-frommnemonic)
- [fromWalletData](_wallets_walletfromethers_.walletfromethers.md#static-fromwalletdata)
- [isSigner](_wallets_walletfromethers_.walletfromethers.md#static-issigner)

## Constructors

### constructor

\+ **new WalletFromEthers**(`privateKey`: string, `mnemonic?`: string): _[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)_

_Overrides void_

**Parameters:**

| Name         | Type   |
| ------------ | ------ |
| `privateKey` | string |
| `mnemonic?`  | string |

**Returns:** _[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)_

## Properties

### address

• **address**: _string_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[address](_wallets_walletfromethers_.walletfromethers.md#address)_

---

### mnemonic

• **mnemonic**: _string_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[mnemonic](_wallets_walletfromethers_.walletfromethers.md#mnemonic)_

---

### path

• **path**: _string_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[path](_wallets_walletfromethers_.walletfromethers.md#path)_

---

### privateKey

• **privateKey**: _string_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[privateKey](_wallets_walletfromethers_.walletfromethers.md#privatekey)_

---

### provider

• **provider**: _Provider_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[provider](_wallets_walletfromethers_.walletfromethers.md#provider)_

_Overrides void_

## Methods

### connect

▸ **connect**(`provider`: Provider): _Wallet_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[connect](_wallets_walletfromethers_.walletfromethers.md#connect)_

Create a new instance of this Wallet connected to provider.

**Parameters:**

| Name       | Type     |
| ---------- | -------- |
| `provider` | Provider |

**Returns:** _Wallet_

---

### encrypt

▸ **encrypt**(`password`: Arrayish | string, `options?`: any, `progressCallback?`: ProgressCallback): _Promise‹string›_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[encrypt](_wallets_walletfromethers_.walletfromethers.md#encrypt)_

**Parameters:**

| Name                | Type                   |
| ------------------- | ---------------------- |
| `password`          | Arrayish &#124; string |
| `options?`          | any                    |
| `progressCallback?` | ProgressCallback       |

**Returns:** _Promise‹string›_

---

### getAddress

▸ **getAddress**(): _Promise‹string›_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[getAddress](_wallets_walletfromethers_.walletfromethers.md#getaddress)_

_Overrides void_

**Returns:** _Promise‹string›_

---

### getBalance

▸ **getBalance**(`blockTag?`: BlockTag): _Promise‹BigNumber›_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[getBalance](_wallets_walletfromethers_.walletfromethers.md#getbalance)_

**Parameters:**

| Name        | Type     |
| ----------- | -------- |
| `blockTag?` | BlockTag |

**Returns:** _Promise‹BigNumber›_

---

### getTransactionCount

▸ **getTransactionCount**(`blockTag?`: BlockTag): _Promise‹number›_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[getTransactionCount](_wallets_walletfromethers_.walletfromethers.md#gettransactioncount)_

**Parameters:**

| Name        | Type     |
| ----------- | -------- |
| `blockTag?` | BlockTag |

**Returns:** _Promise‹number›_

---

### sendTransaction

▸ **sendTransaction**(`transaction`: TransactionRequest): _Promise‹TransactionResponse›_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[sendTransaction](_wallets_walletfromethers_.walletfromethers.md#sendtransaction)_

_Overrides void_

**Parameters:**

| Name          | Type               |
| ------------- | ------------------ |
| `transaction` | TransactionRequest |

**Returns:** _Promise‹TransactionResponse›_

---

### sign

▸ **sign**(`transaction`: TransactionRequest): _Promise‹string›_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[sign](_wallets_walletfromethers_.walletfromethers.md#sign)_

**Parameters:**

| Name          | Type               |
| ------------- | ------------------ |
| `transaction` | TransactionRequest |

**Returns:** _Promise‹string›_

---

### signMessage

▸ **signMessage**(`message`: Arrayish | string): _Promise‹string›_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[signMessage](_wallets_walletfromethers_.walletfromethers.md#signmessage)_

_Overrides void_

**Parameters:**

| Name      | Type                   |
| --------- | ---------------------- |
| `message` | Arrayish &#124; string |

**Returns:** _Promise‹string›_

---

### toEthersWalletData

▸ **toEthersWalletData**(): _[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)_

**Returns:** _[EthersWalletData](../interfaces/_typings_.etherswalletdata.md)_

---

### toIdentityWalletData

▸ **toIdentityWalletData**(`identityAddress`: string): _[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)_

**Parameters:**

| Name              | Type   |
| ----------------- | ------ |
| `identityAddress` | string |

**Returns:** _[IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)_

---

### `Static` createRandom

▸ **createRandom**(): _[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)‹›_

_Overrides void_

**Returns:** _[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)‹›_

---

### `Static` fromEncryptedJson

▸ **fromEncryptedJson**(`encryptedJson`: string, `password`: string, `progressCallback?`: function): _Promise‹[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)‹››_

_Overrides void_

**Parameters:**

▪ **encryptedJson**: _string_

▪ **password**: _string_

▪`Optional` **progressCallback**: _function_

▸ (`progress`: number): _any_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `progress` | number |

**Returns:** _Promise‹[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)‹››_

---

### `Static` fromMnemonic

▸ **fromMnemonic**(`mnemonic`: string): _[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)‹›_

_Overrides void_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `mnemonic` | string |

**Returns:** _[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)‹›_

---

### `Static` fromWalletData

▸ **fromWalletData**(`walletData`: [EthersWalletData](../interfaces/_typings_.etherswalletdata.md) | [IdentityWalletData](../interfaces/_typings_.identitywalletdata.md)): _[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)‹›_

**Parameters:**

| Name         | Type                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `walletData` | [EthersWalletData](../interfaces/_typings_.etherswalletdata.md) &#124; [IdentityWalletData](../interfaces/_typings_.identitywalletdata.md) |

**Returns:** _[WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md)‹›_

---

### `Static` isSigner

▸ **isSigner**(`value`: any): _value is Signer_

_Inherited from [WalletFromEthers](_wallets_walletfromethers_.walletfromethers.md).[isSigner](_wallets_walletfromethers_.walletfromethers.md#static-issigner)_

**Parameters:**

| Name    | Type |
| ------- | ---- |
| `value` | any  |

**Returns:** _value is Signer_
