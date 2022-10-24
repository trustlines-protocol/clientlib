import * as TrustlinesContractsAbi from '@trustlines/trustlines-contracts-abi'
import { writeFile } from 'fs'

const requiredContracts = ['CurrencyNetwork', 'Exchange', 'Identity', 'UnwEth']
const pathContractsModule =
  'node_modules/@trustlines/trustlines-contracts-abi/contracts.json'

const filteredAbi = Object.fromEntries(
  Object.entries(TrustlinesContractsAbi['default']).filter(([key, value]) =>
    requiredContracts.includes(key)
  )
)
const stringAbi = JSON.stringify(filteredAbi)

writeFile(pathContractsModule, stringAbi, function(err, result) {
  if (err) console.log('error', err)
})
