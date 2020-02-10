# Class: Contact

## Hierarchy

- **Contact**

## Index

### Constructors

- [constructor](_contact_.contact.md#constructor)

### Methods

- [createLink](_contact_.contact.md#createlink)
- [getAll](_contact_.contact.md#getall)

## Constructors

### constructor

\+ **new Contact**(`params`: object): _[Contact](_contact_.contact.md)_

**Parameters:**

▪ **params**: _object_

| Name       | Type                                                             |
| ---------- | ---------------------------------------------------------------- |
| `provider` | [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md) |
| `user`     | [User](_user_.user.md)                                           |

**Returns:** _[Contact](_contact_.contact.md)_

## Methods

### createLink

▸ **createLink**(`address`: string, `username`: string, `customBase?`: string): _string_

Creates sharable contact link.

**Parameters:**

| Name          | Type   | Description                                             |
| ------------- | ------ | ------------------------------------------------------- |
| `address`     | string | Address of contact to share.                            |
| `username`    | string | Name of contact to share.                               |
| `customBase?` | string | Optional custom base for link. Default `trustlines://`. |

**Returns:** _string_

---

### getAll

▸ **getAll**(`networkAddress`: string): _Promise‹string[]›_

**Parameters:**

| Name             | Type   |
| ---------------- | ------ |
| `networkAddress` | string |

**Returns:** _Promise‹string[]›_
