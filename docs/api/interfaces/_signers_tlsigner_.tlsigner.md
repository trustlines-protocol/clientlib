# Interface: TLSigner

Interface for different signer strategies.

## Hierarchy

- **TLSigner**

  ↳ [TLWallet](_wallets_tlwallet_.tlwallet.md)

## Implemented by

- [Web3Signer](../classes/_signers_web3signer_.web3signer.md)

## Index

### Methods

- [confirm](_signers_tlsigner_.tlsigner.md#confirm)
- [getAddress](_signers_tlsigner_.tlsigner.md#getaddress)
- [getBalance](_signers_tlsigner_.tlsigner.md#getbalance)
- [getMetaTxFees](_signers_tlsigner_.tlsigner.md#getmetatxfees)
- [getTxInfos](_signers_tlsigner_.tlsigner.md#gettxinfos)
- [signMessage](_signers_tlsigner_.tlsigner.md#signmessage)
- [signMsgHash](_signers_tlsigner_.tlsigner.md#signmsghash)

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](_typings_.rawtxobject.md)): _Promise‹string›_

**Parameters:**

| Name    | Type                                    |
| ------- | --------------------------------------- |
| `rawTx` | [RawTxObject](_typings_.rawtxobject.md) |

**Returns:** _Promise‹string›_

---

### getAddress

▸ **getAddress**(): _Promise‹string›_

**Returns:** _Promise‹string›_

---

### getBalance

▸ **getBalance**(): _Promise‹[Amount](_typings_.amount.md)›_

**Returns:** _Promise‹[Amount](_typings_.amount.md)›_

---

### getMetaTxFees

▸ **getMetaTxFees**(`rawTx`: [RawTxObject](_typings_.rawtxobject.md)): _Promise‹[MetaTransactionFees](_typings_.metatransactionfees.md)›_

**Parameters:**

| Name    | Type                                    |
| ------- | --------------------------------------- |
| `rawTx` | [RawTxObject](_typings_.rawtxobject.md) |

**Returns:** _Promise‹[MetaTransactionFees](_typings_.metatransactionfees.md)›_

---

### getTxInfos

▸ **getTxInfos**(`userAddress`: string): _Promise‹[TxInfos](_typings_.txinfos.md)›_

**Parameters:**

| Name          | Type   |
| ------------- | ------ |
| `userAddress` | string |

**Returns:** _Promise‹[TxInfos](_typings_.txinfos.md)›_

---

### signMessage

▸ **signMessage**(`message`: string | ArrayLike‹number›): _Promise‹[Signature](_typings_.signature.md)›_

**Parameters:**

| Name      | Type                            |
| --------- | ------------------------------- |
| `message` | string &#124; ArrayLike‹number› |

**Returns:** _Promise‹[Signature](_typings_.signature.md)›_

---

### signMsgHash

▸ **signMsgHash**(`msgHash`: string): _Promise‹[Signature](_typings_.signature.md)›_

**Parameters:**

| Name      | Type   |
| --------- | ------ |
| `msgHash` | string |

**Returns:** _Promise‹[Signature](_typings_.signature.md)›_
