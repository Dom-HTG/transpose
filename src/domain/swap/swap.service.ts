import pino from "pino";
import { ToolInput } from "../../internal/ochestrator/agentOchestrator";
import { DataSource } from "typeorm";

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

export class SwapService {
  logger: pino.Logger;
  constructor(
    private applogger: pino.Logger,
    appDataSource: DataSource,
  ) {
    this.logger = applogger;
  }

  public swapToken(swapData: ToolInput) {
    this.logger.debug("Swap service hit successful!");
    this.logger.trace({ swapData }, "swap payload");
  }
}
