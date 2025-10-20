import pino from "pino";
import { ToolInput } from "../../internal/ochestrator/agentOchestrator";

export class TransferService {
  logger: pino.Logger;
  constructor(private applogger: pino.Logger) {
    this.logger = applogger;
  }

  public transferToken(transferData: ToolInput) {
    this.logger.debug("Transfer service hit succesful!");
  }
}
