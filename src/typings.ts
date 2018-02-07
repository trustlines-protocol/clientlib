export interface EventFilterOptions {
  type?: string,
  fromBlock?: number,
  toBlock?: number
}

export interface PaymentOptions {
  decimals?: number,
  maximumHops?: number,
  maximumFees?: number,
  gasPrice?: number,
  gasLimit?: number
}

export interface TxOptions {
  gasPrice?: number,
  gasLimit?: number,
  estimatedGas?: number
}
