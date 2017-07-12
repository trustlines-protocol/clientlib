# trustlines network clientlib

## Get started
### Install dependencies
```
$ npm install
```

### Start mocked relay server
```
$ json-server ./test/mockRelayAPI.json --routes ./test/routes.json
```
The relay server will run on `http://localhost:3000` per default

### Import bundle
```javascript
// directly include bundle in HTML
<html>
  <body>
    <script src="../_bundles/trustlines-network.min.js"></script>
  </body>
</html>

// OR using es6 import
import { TLNetwork } from "../_bundles/trustlines-network"

```

## Compiling and building
Compiling and bundling follows this setup: http://marcobotto.com/compiling-and-bundling-typescript-libraries-with-webpack/

### Library structure
```
_bundles/       // UMD bundles
lib/            // ES5(commonjs) + source + .d.ts
lib-esm/        // ES5(esmodule) + source + .d.ts
package.json
README.md
```
