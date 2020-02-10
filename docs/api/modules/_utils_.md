# External module: "utils"

## Index

### Functions

- [buildApiUrl](_utils_.md#const-buildapiurl)
- [buildUrl](_utils_.md#const-buildurl)
- [calcRaw](_utils_.md#const-calcraw)
- [calcValue](_utils_.md#const-calcvalue)
- [checkAddress](_utils_.md#const-checkaddress)
- [convertEthToWei](_utils_.md#const-convertethtowei)
- [convertToAmount](_utils_.md#const-converttoamount)
- [convertToDelegationFees](_utils_.md#const-converttodelegationfees)
- [convertToHexString](_utils_.md#const-converttohexstring)
- [createLink](_utils_.md#const-createlink)
- [fetchUrl](_utils_.md#const-fetchurl)
- [formatEndpoint](_utils_.md#const-formatendpoint)
- [formatEvent](_utils_.md#const-formatevent)
- [formatExchangeEvent](_utils_.md#const-formatexchangeevent)
- [formatToAmount](_utils_.md#const-formattoamount)
- [formatToAmountInternal](_utils_.md#const-formattoamountinternal)
- [formatToDelegationFeesInternal](_utils_.md#const-formattodelegationfeesinternal)
- [generateRandomNumber](_utils_.md#const-generaterandomnumber)
- [isURL](_utils_.md#const-isurl)
- [trimUrl](_utils_.md#const-trimurl)
- [websocketStream](_utils_.md#const-websocketstream)

## Functions

### `Const` buildApiUrl

▸ **buildApiUrl**(`protocol`: string, `host`: string, `port`: number | string, `path`: string): _string_

Returns URL by concatenating protocol, host, port and path.

**Parameters:**

| Name       | Type                 | Description                 |
| ---------- | -------------------- | --------------------------- |
| `protocol` | string               | relay api endpoint protocol |
| `host`     | string               | relay api host address      |
| `port`     | number &#124; string | relay api port              |
| `path`     | string               | relay api base endpoint     |

**Returns:** _string_

---

### `Const` buildUrl

▸ **buildUrl**(`baseUrl`: string, `params?`: any[] | object): _string_

Encodes URI components and returns a URL.

**Parameters:**

| Name      | Type                | Description                       |
| --------- | ------------------- | --------------------------------- |
| `baseUrl` | string              | base URL                          |
| `params?` | any[] &#124; object | (optional) parameters for queries |

**Returns:** _string_

---

### `Const` calcRaw

▸ **calcRaw**(`value`: number | string | BigNumber, `decimals`: number): _BigNumber_

Returns the smallest representation of a number.

**Parameters:**

| Name       | Type                                  | Description                               |
| ---------- | ------------------------------------- | ----------------------------------------- |
| `value`    | number &#124; string &#124; BigNumber | Representation of number in biggest unit. |
| `decimals` | number                                | Number of decimals.                       |

**Returns:** _BigNumber_

---

### `Const` calcValue

▸ **calcValue**(`raw`: number | string | BigNumber, `decimals`: number): _BigNumber_

Returns the biggest representation of a number.

**Parameters:**

| Name       | Type                                  | Description                                |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `raw`      | number &#124; string &#124; BigNumber | Representation of number in smallest unit. |
| `decimals` | number                                | Number of decimals.                        |

**Returns:** _BigNumber_

---

### `Const` checkAddress

▸ **checkAddress**(`address`: string): _boolean_

Checks if given address is a valid address

**Parameters:**

| Name      | Type   | Description      |
| --------- | ------ | ---------------- |
| `address` | string | ethereum address |

**Returns:** _boolean_

---

### `Const` convertEthToWei

▸ **convertEthToWei**(`value`: number | string): _number_

Converts eth to wei

**Parameters:**

| Name    | Type                 | Description  |
| ------- | -------------------- | ------------ |
| `value` | number &#124; string | value in eth |

**Returns:** _number_

---

### `Const` convertToAmount

▸ **convertToAmount**(`amount`: [AmountInternal](../interfaces/_typings_.amountinternal.md)): _[Amount](../interfaces/_typings_.amount.md)_

Converts an AmountInternal to Amount object.

**Parameters:**

| Name     | Type                                                        | Description            |
| -------- | ----------------------------------------------------------- | ---------------------- |
| `amount` | [AmountInternal](../interfaces/_typings_.amountinternal.md) | AmountInternal object. |

**Returns:** _[Amount](../interfaces/_typings_.amount.md)_

---

### `Const` convertToDelegationFees

▸ **convertToDelegationFees**(`delegationFees`: [DelegationFeesInternal](../interfaces/_typings_.delegationfeesinternal.md)): _[DelegationFeesObject](../interfaces/_typings_.delegationfeesobject.md)_

Formats number into an AmountInternal object which is intended for internal use.

**Parameters:**

| Name             | Type                                                                        | Description                    |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------ |
| `delegationFees` | [DelegationFeesInternal](../interfaces/_typings_.delegationfeesinternal.md) | DelegationFeesInternal object. |

**Returns:** _[DelegationFeesObject](../interfaces/_typings_.delegationfeesobject.md)_

---

### `Const` convertToHexString

▸ **convertToHexString**(`decimalStr`: string | number | BigNumber): _string_

Returns the hexdecimal representation of given decimal string. The value has to be an integer.

**Parameters:**

| Name         | Type                                  | Description                              |
| ------------ | ------------------------------------- | ---------------------------------------- |
| `decimalStr` | string &#124; number &#124; BigNumber | Decimal string representation of number. |

**Returns:** _string_

---

### `Const` createLink

▸ **createLink**(`params`: any[], `customBase?`: string): _string_

Returns a `trustlines://` link.

**Parameters:**

| Name          | Type   | Description                                      |
| ------------- | ------ | ------------------------------------------------ |
| `params`      | any[]  | Parameters of link.                              |
| `customBase?` | string | Optional custom base instead of `trustlines://`. |

**Returns:** _string_

---

### `Const` fetchUrl

▸ **fetchUrl**<**T**>(`url`: string, `options?`: object): _Promise‹T›_

Returns a `Promise` with a JSON object from given URL.

**Type parameters:**

▪ **T**

**Parameters:**

| Name       | Type   | Description |
| ---------- | ------ | ----------- |
| `url`      | string | -           |
| `options?` | object | (optional)  |

**Returns:** _Promise‹T›_

---

### `Const` formatEndpoint

▸ **formatEndpoint**(`endpoint`: string): _string_

Adds a slash to the endpoint if it does not start with it.

**Parameters:**

| Name       | Type   | Description         |
| ---------- | ------ | ------------------- |
| `endpoint` | string | Endpoint to format. |

**Returns:** _string_

---

### `Const` formatEvent

▸ **formatEvent**<**T**>(`event`: any, `networkDecimals`: number, `interestRateDecimals`: number): _T_

Formats the number values of a raw event returned by the relay.

**Type parameters:**

▪ **T**

**Parameters:**

| Name                   | Type   | Description                                |
| ---------------------- | ------ | ------------------------------------------ |
| `event`                | any    | raw event                                  |
| `networkDecimals`      | number | decimals of currency network               |
| `interestRateDecimals` | number | interest rate decimals of currency network |

**Returns:** _T_

---

### `Const` formatExchangeEvent

▸ **formatExchangeEvent**(`exchangeEvent`: [AnyExchangeEventRaw](_typings_.md#anyexchangeeventraw), `makerDecimals`: number, `takerDecimals`: number): _[AnyExchangeEvent](_typings_.md#anyexchangeevent)_

Formats the number values of a raw Exchange event as returned by the relay.

**Parameters:**

| Name            | Type                                                    | Description                                  |
| --------------- | ------------------------------------------------------- | -------------------------------------------- |
| `exchangeEvent` | [AnyExchangeEventRaw](_typings_.md#anyexchangeeventraw) | raw exchange event: `LogFill` or `LogCancel` |
| `makerDecimals` | number                                                  | decimals in maker token                      |
| `takerDecimals` | number                                                  | decimals in taker token                      |

**Returns:** _[AnyExchangeEvent](_typings_.md#anyexchangeevent)_

---

### `Const` formatToAmount

▸ **formatToAmount**(`raw`: number | string | BigNumber, `decimals`: number): _[Amount](../interfaces/_typings_.amount.md)_

Formats raw representation of number into a Amount object.

**Parameters:**

| Name       | Type                                  | Description                                |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `raw`      | number &#124; string &#124; BigNumber | Representation of number in smallest unit. |
| `decimals` | number                                | Number of decimals.                        |

**Returns:** _[Amount](../interfaces/_typings_.amount.md)_

---

### `Const` formatToAmountInternal

▸ **formatToAmountInternal**(`raw`: number | string | BigNumber, `decimals`: number): _[AmountInternal](../interfaces/_typings_.amountinternal.md)_

Formats number into an AmountInternal object which is intended for internal use.

**Parameters:**

| Name       | Type                                  | Description                                |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `raw`      | number &#124; string &#124; BigNumber | Representation of number in smallest unit. |
| `decimals` | number                                | Number of decimals.                        |

**Returns:** _[AmountInternal](../interfaces/_typings_.amountinternal.md)_

---

### `Const` formatToDelegationFeesInternal

▸ **formatToDelegationFeesInternal**(`baseFee`: number | string | BigNumber, `decimals`: number, `gasPrice`: number | string | BigNumber, `currencyNetworkOfFees`: string): _[DelegationFeesInternal](../interfaces/_typings_.delegationfeesinternal.md)_

Formats number into an AmountInternal object which is intended for internal use.

**Parameters:**

| Name                    | Type                                  | Description                                               |
| ----------------------- | ------------------------------------- | --------------------------------------------------------- |
| `baseFee`               | number &#124; string &#124; BigNumber | -                                                         |
| `decimals`              | number                                | Number of decimals.                                       |
| `gasPrice`              | number &#124; string &#124; BigNumber | -                                                         |
| `currencyNetworkOfFees` | string                                | the currency network corresponding to the delegation fees |

**Returns:** _[DelegationFeesInternal](../interfaces/_typings_.delegationfeesinternal.md)_

---

### `Const` generateRandomNumber

▸ **generateRandomNumber**(`decimals`: number): _BigNumber_

Generates a random number with specified decimals.

**Parameters:**

| Name       | Type   | Description                                        |
| ---------- | ------ | -------------------------------------------------- |
| `decimals` | number | Decimals which determine size of generated number. |

**Returns:** _BigNumber_

---

### `Const` isURL

▸ **isURL**(`str`: any): _boolean_

Checks if given string is a valid url.

**Parameters:**

| Name  | Type | Description      |
| ----- | ---- | ---------------- |
| `str` | any  | String to check. |

**Returns:** _boolean_

---

### `Const` trimUrl

▸ **trimUrl**(`url`: string): _string_

Trims url from slashes.

**Parameters:**

| Name  | Type   | Description                     |
| ----- | ------ | ------------------------------- |
| `url` | string | URL to be trimmed from slashes. |

**Returns:** _string_

---

### `Const` websocketStream

▸ **websocketStream**(`url`: string, `functionName`: string, `args`: object, `reconnectingOptions`: [ReconnectingWSOptions](_typings_.md#reconnectingwsoptions)): _Observable‹any›_

Returns an Observable for a websocket stream.

**Parameters:**

| Name                  | Type                                                        | Default | Description                                   |
| --------------------- | ----------------------------------------------------------- | ------- | --------------------------------------------- |
| `url`                 | string                                                      | -       | URL to open websocket stream to.              |
| `functionName`        | string                                                      | -       | Name of function to call on opened websocket. |
| `args`                | object                                                      | -       | Arguments for above function.                 |
| `reconnectingOptions` | [ReconnectingWSOptions](_typings_.md#reconnectingwsoptions) | {}      | -                                             |

**Returns:** _Observable‹any›_
