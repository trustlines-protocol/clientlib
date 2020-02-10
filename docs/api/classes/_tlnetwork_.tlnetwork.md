# Class: TLNetwork

The TLNetwork class is the single entry-point into the trustlines-clientlib.
It contains all of the library's functionality and all calls to the library should be made through a `TLNetwork` instance.

## Hierarchy

- **TLNetwork**

## Index

### Constructors

- [constructor](_tlnetwork_.tlnetwork.md#constructor)

### Properties

- [currencyNetwork](_tlnetwork_.tlnetwork.md#currencynetwork)
- [event](_tlnetwork_.tlnetwork.md#event)
- [payment](_tlnetwork_.tlnetwork.md#payment)
- [trustline](_tlnetwork_.tlnetwork.md#trustline)
- [user](_tlnetwork_.tlnetwork.md#user)

## Constructors

### constructor

\+ **new TLNetwork**(`config`: [TLNetworkConfig](../interfaces/_typings_.tlnetworkconfig.md)): _[TLNetwork](_tlnetwork_.tlnetwork.md)_

Initiates a new TLNetwork instance that provides the public interface to trustlines-clientlib.

**Parameters:**

| Name     | Type                                                          | Default | Description                                                                                                   |
| -------- | ------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `config` | [TLNetworkConfig](../interfaces/_typings_.tlnetworkconfig.md) | {}      | Configuration object. See [TLNetworkConfig](../interfaces/_typings_.tlnetworkconfig.md) for more information. |

**Returns:** _[TLNetwork](_tlnetwork_.tlnetwork.md)_

## Properties

### currencyNetwork

• **currencyNetwork**: _[CurrencyNetwork](_currencynetwork_.currencynetwork.md)_

CurrencyNetwork instance containing all methods for retrieving currency network
related information.

---

### event

• **event**: _[Event](_event_.event.md)_

Event instance for retrieving and formatting event logs.

---

### payment

• **payment**: _[Payment](_payment_.payment.md)_

Payment instance containing all methods for creating trustline transfers
and TLC transfers.

---

### trustline

• **trustline**: _[Trustline](_trustline_.trustline.md)_

Trustline instance containing all methods for managing trustlines.

---

### user

• **user**: _[User](_user_.user.md)_

User instance containing all user/keystore related methods.
