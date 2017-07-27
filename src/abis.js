export default {
  "IdentityFactoryWithRecovery": [
    {
      "constant":false,
      "inputs": [
        {
          "name": "destination",
          "type": "address"
        },
        {
          "name": "userKey",
          "type": "address"
        },
        {
          "name":"_recoveryKey",
          "type":"address"
        },
        {
          "name":"longTimeLock",
          "type":"uint256"
        },
        {
          "name":"shortTimeLock",
          "type":"uint256"
        }
      ],
      "name":"CreateProxyWithControllerAndRecoveryKey",
      "outputs":[],
      "payable":false,
      "type":"function"
    },
    {
      "constant":true,
      "inputs":[{"name":"","type":"address"}],"name":"recoveryToProxy","outputs":[{"name":"","type":"address"}],
      "payable":false,
      "type":"function"
    },
    {
      "constant":true,
      "inputs":[{"name":"","type":"address"}],"name":"senderToProxy","outputs":[{"name":"","type":"address"}],
      "payable":false,
      "type":"function"
    },
    {
      "anonymous":false,
      "inputs":[{"indexed":true,"name":"userKey","type":"address"},{"indexed":false,"name":"proxy","type":"address"},{"indexed":false,"name":"controller","type":"address"},{"indexed":true,"name":"recoveryKey","type":"address"}],
      "name":"IdentityCreated","type":"event"
    }
  ],
  "CurrencyNetwork": [
    {
      "constant": true,
      "inputs": [
        {
          "name": "_A",
          "type": "address"
        },
        {
          "name": "_B",
          "type": "address"
        }
      ],
      "name": "trustline",
      "outputs": [
        {
          "name": "creditlineAB",
          "type": "int256"
        },
        {
          "name": "creditlineBA",
          "type": "int256"
        },
        {
          "name": "balanceAB",
          "type": "int256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "name": "supply",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "friends",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_spender",
          "type": "address"
        },
        {
          "name": "_receiver",
          "type": "address"
        }
      ],
      "name": "spendableTo",
      "outputs": [
        {
          "name": "remaining",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "name": "",
          "type": "uint8"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        },
        {
          "name": "_path",
          "type": "address[]"
        }
      ],
      "name": "mediatedTransfer",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_spender",
          "type": "address"
        }
      ],
      "name": "spendable",
      "outputs": [
        {
          "name": "spendable",
          "type": "uint256"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_debtor",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "updateCreditline",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "users",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "tokenName",
          "type": "string"
        },
        {
          "name": "tokenSymbol",
          "type": "string"
        },
        {
          "name": "decimalUnits",
          "type": "uint8"
        }
      ],
      "payable": false,
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_creditor",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_debtor",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "CreditlineUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_from",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_value",
          "type": "int256"
        }
      ],
      "name": "BalanceUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_from",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    }
  ]
}
