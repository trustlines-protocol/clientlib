# Injected Web3 Example

This example shows how to use an existing web3 provider with the trustlines-clientlib.

## Start Example

The easiest way to start this example is to run our [e2e setup](https://github.com/trustlines-protocol/end2end) with the [backend only flag](https://github.com/trustlines-protocol/end2end#running-only-the-backend).

After starting our e2e docker-compose setup, run the following command in this repository:

```bash
yarn serve
```

This will create a webpack bundle and serve it with the `<PROJECT_ROOT>/examples/injected-web3/index.html` example file on `http://localhost:8081`.
Make sure to use an Ethereum-compatible browser to visit the example page.
