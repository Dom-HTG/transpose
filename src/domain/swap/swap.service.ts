interface ISwap {
  id: string;
  txHash: string;
  protocol: string;
  fromAsset: string;
  toAsset: string;
  amountExpected: string;
  amountReceived: string;
  slippage: string;
  createdAt: Date;
  updatedAt: Date;
}
