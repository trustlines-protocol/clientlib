## Events

One event entity has properties:

```javascript
{
  transactionId,  // transaction id on the blockchain, optional since transaction might be pending
  timestamp,      // unix timestamp
  subject,        // (optional)
  eventtype,      // one on the eventtypes defined below
  address,        // network address of the counter party
  direction,      // send | receive 
  status          // e.g. pending | done ... 
}
```

### Eventtypes

* transfer
* creditlineUpdate
* creditlineUpdateRequest
* order
