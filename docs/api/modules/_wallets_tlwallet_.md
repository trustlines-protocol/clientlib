# External module: "wallets/TLWallet"

## Index

### Interfaces

- [TLWallet](../interfaces/_wallets_tlwallet_.tlwallet.md)

### Variables

- [DEFAULT_DERIVATION_PATH](_wallets_tlwallet_.md#const-default_derivation_path)
- [EXPECTED_VERSIONS](_wallets_tlwallet_.md#const-expected_versions)
- [TL_WALLET_VERSION](_wallets_tlwallet_.md#const-tl_wallet_version)
- [WALLET_TYPE_ETHERS](_wallets_tlwallet_.md#const-wallet_type_ethers)
- [WALLET_TYPE_IDENTITY](_wallets_tlwallet_.md#const-wallet_type_identity)

### Functions

- [verifyWalletData](_wallets_tlwallet_.md#verifywalletdata)

## Variables

### `Const` DEFAULT_DERIVATION_PATH

• **DEFAULT_DERIVATION_PATH**: _"m/44'/60'/0'/0/0"_ = `m/44'/60'/0'/0/0`

---

### `Const` EXPECTED_VERSIONS

• **EXPECTED_VERSIONS**: _number[]_ = [1]

---

### `Const` TL_WALLET_VERSION

• **TL_WALLET_VERSION**: _1_ = 1

---

### `Const` WALLET_TYPE_ETHERS

• **WALLET_TYPE_ETHERS**: _"ethers"_ = "ethers"

---

### `Const` WALLET_TYPE_IDENTITY

• **WALLET_TYPE_IDENTITY**: _"identity"_ = "identity"

## Functions

### verifyWalletData

▸ **verifyWalletData**(`walletData`: [TLWalletData](../interfaces/_typings_.tlwalletdata.md), `walletType`: string, `expectedVersions`: number[]): _void_

Checks if type and version of given wallet data are supported.

**Parameters:**

| Name               | Type                                                    | Description               |
| ------------------ | ------------------------------------------------------- | ------------------------- |
| `walletData`       | [TLWalletData](../interfaces/_typings_.tlwalletdata.md) | Wallet data to check.     |
| `walletType`       | string                                                  | Expected wallet type.     |
| `expectedVersions` | number[]                                                | Expected wallet versions. |

**Returns:** _void_
