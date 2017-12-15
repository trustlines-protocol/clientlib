export const keystore1 = `{"encSeed":{"encStr":"I4qBGJUmpzHUQoVRMkjMEAqGusa4oI7HEG7SQMYPO31OIH+UlFtEDGfOuADzFYsfHKMbImJIOnhEg5z3VzvnndRlV9V9zHjbPgOysoMkF0K3ZR7DtamiBhk2CW3s8gx9Y2liECI03gOzz2Z51/jFLtDVrKs8HaF+ao4AnpmBZ9BgmX1F2fcZvA==","nonce":"nToBO+VpArhjS3PtICUBpjpc5cEDcmQ0"},"encHdRootPriv":{"encStr":"MMfdnPGEYRuPvOGaZvjrqHkrC+QT+GYSk1Nj1n76BbGjx3Kv37Rptb74wEcL7oRsBDJDHN1fLbeeXdwW6ZoGZaGnB8K+mdNBq+84PMGyfs/pvEQ4b81mPYP/Nw/Lgy8MwvSnwqupI8ZtA67zBDSSTWaQ1qN16Y4CID2SUEaJtQ==","nonce":"Tdsr0BdTZxaP655dmg1l14g8HdF3nTcl"},"addresses":["f8e191d2cd72ff35cb8f012685a29b31996614ea"],"encPrivKeys":{"f8e191d2cd72ff35cb8f012685a29b31996614ea":{"key":"of9sXYDnUtDeO8x3XYS50NN3XtyKXIvgNlfH773sbQAbqvUHqzmKRnMsb45Vlgup","nonce":"dfinYhD8qUzMM9KyK5fpnUmEh1hrEQDE"}},"hdPathString":"m/44\'/60\'/0\'/0","salt":"Wz3bQi0l8ZMncTBB5qTNjXS/uneTMZakQsVrA7Eo9YM=","hdIndex":1,"version":3}`

export const keystore2 = `{"encSeed":{"encStr":"UJrWA2ZaPF6lnWVktF/VjtLFJ3EZRpmhaw/wWMxMpNIxllyslNFtPSO4fWCn5v5hXqbjD9cCCWoRFYhKeXUsp2bN4uU6TJbQfGEtpT4ptOmoo4TJKbZNdIYq4ldDh7LidayT49zd+0+Qo4/ZP8Kj4NVQO7BaqkZgUhv41gr68nMWErecZhBXNQ==","nonce":"iJpRWz6rlhWlV0EF/Ig4/nvYmBq1H5II"},"ksData":{"m/44'/60'/0'/0":{"info":{"curve":"secp256k1","purpose":"sign"},"encHdPathPriv":{"encStr":"iXJJHp3vDwQOeBkhcmp6+4B7NGnf4CYxBRRYOk2DxZEz0SSJM0F1woJn1rQi3nRVdxFoUfVXEhUHr3Nkw+4B+jGX0LWjG81DkJ9ovSe/3BMSkXyUwFyZgyOLFinLrMH22uJ7BT0l9h5e9plLTzjsvLk+7q8YrKgylGt/6flFKA==","nonce":"0wLXvs0gppLxHMpOAnX/kQkTnNCL5467"},"hdIndex":1,"encPrivKeys":{"ce2d6f8bc55a61428d32947bc9bc7f2de1640b18":{"key":"t4pBsWrvJx3Zn/msrNAmJuH7btIawqhTUasDl12evPBcG3eKoljEyJF5dG3N5QOK","nonce":"du/KqEumtY9nbxT5Zs23i8zi5AterRTY"}},"addresses":["ce2d6f8bc55a61428d32947bc9bc7f2de1640b18"]},"m/44'/60'/0'/1":{"info":{"curve":"curve25519","purpose":"asymEncrypt"},"encHdPathPriv":{"encStr":"eqNBlf119aaDQRTCWW14OJtvTba7EkaFEw30BuXHvNG61h/0e9qC59sF1TvNqSg2fhWFzWN7Z9WJd5f+Yy6dq6487goJuc/UhI99wlvHhG+p7mIsSfP5QayV1U2XZv+JTHbU3nfRs91dhzIhc4j3lUySbm3pfmEPnqaxoCHe9A==","nonce":"52IHSj2WeHDWyqazIaeBrMnClAyFk4Ut"},"hdIndex":1,"encPrivKeys":{"423b6f895e9eda6dff738c9e572b17dd76db460564b71a9eef864ac89930eb77":{"key":"db4QvXmmb/Rk/xaVHurnAhjEzWn+KNeLo/y92j/ffG3a1slJu27CWsIVMfCKAKNT","nonce":"IHnuBp4VDGl4wR7zJ5ikdG6OqTQFMH4b"}},"pubKeys":["423b6f895e9eda6dff738c9e572b17dd76db460564b71a9eef864ac89930eb77"]}},"encHdRootPriv":{"encStr":"rIUuzH9VunRl3TzfsmDhOqFd8s083i+2rTeRBOTIm6sRVTSlwPmFnpLXLZji60mzGBkUpmcYvV7t10EA/UyT3pBVC+D+9KrWLT9GieTAJIEYryJUBFXr05OSBOziSOcTBp8a1LEFkvrgUuApqLmsHN3j+VDyZIOXsiHqR67ofg==","nonce":"Clkz0qaQ8YIUf8EaicZq8S5AfHz4o2vQ"},"salt":"jICGZMaFF14gIhzmxG/twe/et3UpMhHfH0cYxGPljXg=","version":2}`

export const config = {
  protocol: 'https',
  host: "testrelay0.trustlines.network",
  useWebSockets: false,
  path: "api/v1/"
}

export const user1 = {
  address: '0xf8e191d2cd72ff35cb8f012685a29b31996614ea',
  proxyAddress: '0xf8e191d2cd72ff35cb8f012685a29b31996614ea',
  keystore: keystore1,
  pubKey: 'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472'
}

export const user2 = {
  address: '0xce2d6f8bc55a61428d32947bc9bc7f2de1640b18',
  proxyAddress: '0xce2d6f8bc55a61428d32947bc9bc7f2de1640b18',
  keystore: keystore2
}

export const networkAddress = '0x2a2b68e9bf718dbf6df3df91174a136054a8a0ec'
