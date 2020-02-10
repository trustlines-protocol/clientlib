# Class: Messaging

## Hierarchy

- **Messaging**

## Index

### Constructors

- [constructor](_messaging_.messaging.md#constructor)

### Methods

- [messageStream](_messaging_.messaging.md#messagestream)
- [paymentRequest](_messaging_.messaging.md#paymentrequest)
- [sendUsernameToCounterparty](_messaging_.messaging.md#sendusernametocounterparty)

## Constructors

### constructor

\+ **new Messaging**(`params`: object): _[Messaging](_messaging_.messaging.md)_

**Parameters:**

▪ **params**: _object_

| Name              | Type                                                             |
| ----------------- | ---------------------------------------------------------------- |
| `currencyNetwork` | [CurrencyNetwork](_currencynetwork_.currencynetwork.md)          |
| `provider`        | [TLProvider](../interfaces/_providers_tlprovider_.tlprovider.md) |
| `user`            | [User](_user_.user.md)                                           |

**Returns:** _[Messaging](_messaging_.messaging.md)_

## Methods

### messageStream

▸ **messageStream**(`reconnectingOptions?`: [ReconnectingWSOptions](../modules/_typings_.md#reconnectingwsoptions)): _Observable‹any›_

Returns a websocket observable that can be subscribed to.

**Parameters:**

| Name                   | Type                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| `reconnectingOptions?` | [ReconnectingWSOptions](../modules/_typings_.md#reconnectingwsoptions) |

**Returns:** _Observable‹any›_

---

### paymentRequest

▸ **paymentRequest**(`networkAddress`: string, `counterPartyAddress`: string, `value`: number | string, `subject?`: string, `options`: object): _Promise‹[PaymentRequestMessage](../interfaces/_typings_.paymentrequestmessage.md)›_

Sends a payment request to given `counterParty` and returns created payment request.

**Parameters:**

▪ **networkAddress**: _string_

Address of currency network.

▪ **counterPartyAddress**: _string_

Address of counter party.

▪ **value**: _number | string_

Requested payment amount.

▪`Optional` **subject**: _string_

Optional subject of payment request.

▪`Default value` **options**: _object_= {}

| Name               | Type                                                          |
| ------------------ | ------------------------------------------------------------- |
| `decimalsOptions?` | [DecimalsOptions](../interfaces/_typings_.decimalsoptions.md) |

**Returns:** _Promise‹[PaymentRequestMessage](../interfaces/_typings_.paymentrequestmessage.md)›_

---

### sendUsernameToCounterparty

▸ **sendUsernameToCounterparty**(`username`: string, `counterpartyAddress`: string): _Promise‹[UsernameMessage](../interfaces/_typings_.usernamemessage.md)›_

Sends the given username to the specified counter party via messaging.

**Parameters:**

| Name                  | Type   | Description       |
| --------------------- | ------ | ----------------- |
| `username`            | string | Username to send. |
| `counterpartyAddress` | string | -                 |

**Returns:** _Promise‹[UsernameMessage](../interfaces/_typings_.usernamemessage.md)›_
