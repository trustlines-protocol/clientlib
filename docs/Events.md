## Events

One event entity has properties:

```javascript
{
  transactionId,  // transaction id on the blockchain, optional since transaction might be pending
  timestamp,      // unix timestamp
  subject,        // (optional)
  type,           // one on the event types defined below
  address,        // (proxy?)address of the counter party
  direction,      // sent | received
  status,         // sent | pending | confirmed
  amount
}
```

### Event Types

* Transfer
* CreditlineUpdate
* CreditlineUpdateRequest
* ChequeCashed
