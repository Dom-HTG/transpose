import pino from "pino";
import { transferDTO } from "../../infrastructure/agent/tools";

export class TransferService {
    logger: pino.Logger;
    constructor(private applogger: pino.Logger) {
        this.logger = applogger;
    }

    public transferToken(transferData: transferDTO) {
        this.logger.debug('Transfer service hit succesful!');
    }
}