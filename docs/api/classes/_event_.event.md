# Class: Event

The Event class contains all methods related to retrieving event logs.
It is meant to be called via a [TLNetwork](_tlnetwork_.tlnetwork.md) instance like:

```typescript
const tlNetwork = new TLNetwork()
//...

// Get transfer logs
tlNetwork.event
  .get
  // ...
  ()
  .then(events => console.log('Events of loaded user:', events))
```

## Hierarchy

- **Event**

## Index

### Methods

- [getAll](_event_.event.md#getall)

## Methods

### getAll

▸ **getAll**(`filter`: [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md)): _Promise‹[AnyEvent](../modules/_typings_.md#anyevent)[]›_

Returns event logs of loaded user in all currency networks.

**Parameters:**

| Name     | Type                                                                | Default | Description                                                                                                        |
| -------- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `filter` | [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) | {}      | Event filter object. See [EventFilterOptions](../interfaces/_typings_.eventfilteroptions.md) for more information. |

**Returns:** _Promise‹[AnyEvent](../modules/_typings_.md#anyevent)[]›_
