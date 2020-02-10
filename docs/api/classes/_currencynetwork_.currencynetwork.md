# Class: CurrencyNetwork

The [CurrencyNetwork](_currencynetwork_.currencynetwork.md) class contains all functions relevant for retrieving currency network related information.
It is meant to be called via a [TLNetwork](_tlnetwork_.tlnetwork.md) instance like:

```typescript
const tlNetwork = new TLNetwork(...)

// Get all networks
tlNetwork.currencyNetwork.getAll().then(
 networks => console.log("All networks:", networks)
)
```

## Hierarchy

- **CurrencyNetwork**

## Index

### Methods

- [getAll](_currencynetwork_.currencynetwork.md#getall)
- [getInfo](_currencynetwork_.currencynetwork.md#getinfo)
- [getUserOverview](_currencynetwork_.currencynetwork.md#getuseroverview)
- [getUsers](_currencynetwork_.currencynetwork.md#getusers)

## Methods

### getAll

▸ **getAll**(): _Promise‹[NetworkDetails](../interfaces/_typings_.networkdetails.md)[]›_

Returns all registered currency networks.

**Returns:** _Promise‹[NetworkDetails](../interfaces/_typings_.networkdetails.md)[]›_

---

### getInfo

▸ **getInfo**(`networkAddress`: string): _Promise‹[NetworkDetails](../interfaces/_typings_.networkdetails.md)›_

Returns detailed information of specific currency network.

**Parameters:**

| Name             | Type   | Description                    |
| ---------------- | ------ | ------------------------------ |
| `networkAddress` | string | Address of a currency network. |

**Returns:** _Promise‹[NetworkDetails](../interfaces/_typings_.networkdetails.md)›_

A network object with information about name, decimals, number of users and address.

---

### getUserOverview

▸ **getUserOverview**(`networkAddress`: string, `userAddress`: string, `options`: object): _Promise‹[UserOverview](../interfaces/_typings_.useroverview.md)›_

Returns overview of a user in a specific currency network.

**Parameters:**

▪ **networkAddress**: _string_

Address of a currency network.

▪ **userAddress**: _string_

Address of a user.

▪`Default value` **options**: _object_= {}

| Name               | Type                                                          |
| ------------------ | ------------------------------------------------------------- |
| `decimalsOptions?` | [DecimalsOptions](../interfaces/_typings_.decimalsoptions.md) |

**Returns:** _Promise‹[UserOverview](../interfaces/_typings_.useroverview.md)›_

---

### getUsers

▸ **getUsers**(`networkAddress`: string): _Promise‹string[]›_

Returns all addresses of users in a currency network.

**Parameters:**

| Name             | Type   | Description                    |
| ---------------- | ------ | ------------------------------ |
| `networkAddress` | string | Address of a currency network. |

**Returns:** _Promise‹string[]›_
