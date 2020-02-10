# Class: Exchange

The Exchange class contains all methods for making/taking orders, retrieving the orderbook
and more.

## Hierarchy

- **Exchange**

## Index

### Constructors

- [constructor](_exchange_.exchange.md#constructor)

### Methods

- [confirm](_exchange_.exchange.md#confirm)
- [getExAddresses](_exchange_.exchange.md#getexaddresses)
- [getLogs](_exchange_.exchange.md#getlogs)
- [getOrderByHash](_exchange_.exchange.md#getorderbyhash)
- [getOrderbook](_exchange_.exchange.md#getorderbook)
- [getOrders](_exchange_.exchange.md#getorders)
- [makeOrder](_exchange_.exchange.md#makeorder)
- [prepCancelOrder](_exchange_.exchange.md#prepcancelorder)
- [prepTakeOrder](_exchange_.exchange.md#preptakeorder)

## Constructors

### constructor

\+ **new Exchange**(`params`: object): _[Exchange](_exchange_.exchange.md)_

**Parameters:**

▪ **params**: _object_

| Name              | Type                                                             |
| ----------------- | ---------------------------------------------------------------- |
| `currencyNetwork` | [CurrencyNetwork](_currencynetwork_.currencynetwork.md)          |
| `event`           | [Event](_event_.event.md)                                        |
| `payment`         | [Payment](_payment_.payment.md)                                  |
| `provider`        | [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md) |
| `transaction`     | [Transaction](_transaction_.transaction.md)                      |
| `user`            | [User](_user_.user.md)                                           |

**Returns:** _[Exchange](_exchange_.exchange.md)_

## Methods

### confirm

▸ **confirm**(`rawTx`: [RawTxObject](../interfaces/_typings_.rawtxobject.md)): _Promise‹string›_

Signs a raw transaction object as returned by `prepCancelOrder` or `prepFillOrder`
and sends the signed transaction.

**Parameters:**

| Name    | Type                                                  | Description             |
| ------- | ----------------------------------------------------- | ----------------------- |
| `rawTx` | [RawTxObject](../interfaces/_typings_.rawtxobject.md) | Raw transaction object. |

**Returns:** _Promise‹string›_

---

### getExAddresses

▸ **getExAddresses**(): _Promise‹string[]›_

Returns all known exchange contract addresses.

**Returns:** _Promise‹string[]›_

---

### getLogs

▸ **getLogs**(`exchangeAddress`: string, `filter`: [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md)): _Promise‹[AnyExchangeEvent](../modules/_typings_.md#anyexchangeevent)[]›_

Returns event logs of the Exchange contract for the loaded user.

**Parameters:**

| Name              | Type                                                                | Default | Description                                                         |
| ----------------- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `exchangeAddress` | string                                                              | -       | Address of Exchange contract.                                       |
| `filter`          | [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) | {}      | Event filter object. See `EventFilterOptions` for more information. |

**Returns:** _Promise‹[AnyExchangeEvent](../modules/_typings_.md#anyexchangeevent)[]›_

---

### getOrderByHash

▸ **getOrderByHash**(`orderHash`: string, `options`: [OrderOptions](../interfaces/_typings_.orderoptions.md)): _Promise‹[SignedOrder](../interfaces/_typings_.signedorder.md)›_

Returns a specific order by its hash.

**Parameters:**

| Name        | Type                                                    | Default | Description                          |
| ----------- | ------------------------------------------------------- | ------- | ------------------------------------ |
| `orderHash` | string                                                  | -       | keccak-256 hash of order.            |
| `options`   | [OrderOptions](../interfaces/_typings_.orderoptions.md) | {}      | See `OrderOptions` for more details. |

**Returns:** _Promise‹[SignedOrder](../interfaces/_typings_.signedorder.md)›_

---

### getOrderbook

▸ **getOrderbook**(`baseTokenAddress`: string, `quoteTokenAddress`: string, `options`: [OrderbookOptions](../interfaces/_typings_.orderbookoptions.md)): _Promise‹[Orderbook](../interfaces/_typings_.orderbook.md)›_

Returns the orderbook for a given token pair.

**Parameters:**

| Name                | Type                                                            | Default | Description                              |
| ------------------- | --------------------------------------------------------------- | ------- | ---------------------------------------- |
| `baseTokenAddress`  | string                                                          | -       | Address of base token.                   |
| `quoteTokenAddress` | string                                                          | -       | Address of quote token.                  |
| `options`           | [OrderbookOptions](../interfaces/_typings_.orderbookoptions.md) | {}      | See `OrderbookOptions` for more details. |

**Returns:** _Promise‹[Orderbook](../interfaces/_typings_.orderbook.md)›_

---

### getOrders

▸ **getOrders**(`query`: [OrdersQuery](../interfaces/_typings_.ordersquery.md)): _Promise‹[SignedOrder](../interfaces/_typings_.signedorder.md)[]›_

Returns orders that match given query parameters.

**Parameters:**

| Name    | Type                                                  | Default | Description                             |
| ------- | ----------------------------------------------------- | ------- | --------------------------------------- |
| `query` | [OrdersQuery](../interfaces/_typings_.ordersquery.md) | {}      | See `OrdersQuery` for more information. |

**Returns:** _Promise‹[SignedOrder](../interfaces/_typings_.signedorder.md)[]›_

---

### makeOrder

▸ **makeOrder**(`exchangeContractAddress`: string, `makerTokenAddress`: string, `takerTokenAddress`: string, `makerTokenValue`: number | string, `takerTokenValue`: number | string, `options`: [ExchangeOptions](../interfaces/_typings_.exchangeoptions.md)): _Promise‹[SignedOrder](../interfaces/_typings_.signedorder.md)›_

Creates an order and posts it to the relay server. If successful, the method returns the created order.

**Parameters:**

| Name                      | Type                                                          | Default | Description                                                            |
| ------------------------- | ------------------------------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `exchangeContractAddress` | string                                                        | -       | Address of exchange contract.                                          |
| `makerTokenAddress`       | string                                                        | -       | Address of token the maker (loaded user) is offering.                  |
| `takerTokenAddress`       | string                                                        | -       | Address of token the maker (loaded user) is requesting from the taker. |
| `makerTokenValue`         | number &#124; string                                          | -       | Amount of token the maker (loaded user) is offering.                   |
| `takerTokenValue`         | number &#124; string                                          | -       | Amount of token the maker (loaded user) is requesting from the taker.  |
| `options`                 | [ExchangeOptions](../interfaces/_typings_.exchangeoptions.md) | {}      | See `ExchangeOptions` for more information.                            |

**Returns:** _Promise‹[SignedOrder](../interfaces/_typings_.signedorder.md)›_

---

### prepCancelOrder

▸ **prepCancelOrder**(`signedOrder`: [SignedOrder](../interfaces/_typings_.signedorder.md), `cancelTakerTokenValue`: number | string, `options`: [ExchangeTxOptions](../modules/_typings_.md#exchangetxoptions)): _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

Prepares an ethereum transaction for cancelling an order.

**Parameters:**

| Name                    | Type                                                           | Default | Description                                                                         |
| ----------------------- | -------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `signedOrder`           | [SignedOrder](../interfaces/_typings_.signedorder.md)          | -       | The order to cancel as returned by `getOrderbook`, `getOrders` or `getOrderByHash`. |
| `cancelTakerTokenValue` | number &#124; string                                           | -       | Amount of tokens the maker (loaded user) wants to cancel.                           |
| `options`               | [ExchangeTxOptions](../modules/_typings_.md#exchangetxoptions) | {}      | See `ExchangeTxOptions` for more information.                                       |

**Returns:** _Promise‹[TxObject](../interfaces/_typings_.txobject.md)›_

---

### prepTakeOrder

▸ **prepTakeOrder**(`signedOrder`: [SignedOrder](../interfaces/_typings_.signedorder.md), `fillTakerTokenValue`: number | string, `options`: [ExchangeTxOptions](../modules/_typings_.md#exchangetxoptions)): _Promise‹[ExchangeTx](../interfaces/_typings_.exchangetx.md)›_

Prepares an ethereum transaction object for taking an order.

**Parameters:**

| Name                  | Type                                                           | Default | Description                                                                       |
| --------------------- | -------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| `signedOrder`         | [SignedOrder](../interfaces/_typings_.signedorder.md)          | -       | The order to take as returned by `getOrderbook`, `getOrders` or `getOrderByHash`. |
| `fillTakerTokenValue` | number &#124; string                                           | -       | Amount of tokens the taker (loaded user) wants to fill.                           |
| `options`             | [ExchangeTxOptions](../modules/_typings_.md#exchangetxoptions) | {}      | See `ExchangeTxOptions` for more information.                                     |

**Returns:** _Promise‹[ExchangeTx](../interfaces/_typings_.exchangetx.md)›_
