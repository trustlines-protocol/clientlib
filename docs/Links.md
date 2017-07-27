##Links

To trigger a trustlines process from outside of the app there are several links, that should find a corresponding route in the app. These links also represent the content of the corrensponding QRCodes

###onboarding

```
/onboarding/[username]/[pubkey]
 
[username]  name of the user to be onboarded
[pubkey]    public key of the user to be onboarded 
```  

###payment request

```
/paymentrequest/[network]/[address]/[amount]/[subject]
 
[network]   address of the network the transfer will be issued in
[address]   address that will receive the transfer 
[amount]    amount that will be transfered in the currency of the network
[subject]   subject of the transfer
```

###contact add

```
/contact/[address]/[username]
 
[address]   address that will receive the transfer 
[username]  proposition of a username 
```