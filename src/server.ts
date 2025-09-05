import express from "express";
import pino from "pino";
import { BaseConfig, AppConfigs } from "./config/app.config";
import { CliManager } from "./cli/cliManager";
import { PinoLogger } from "./lib/logger/logger";
import { Server } from "http";

export class AppServer {
  /* start express application */
  private app: express.Application = express();
  private httpServer: any;
  private config: BaseConfig;
  private logger: pino.Logger;

  constructor() {
    /* initialize application logger */
    const pinoLogger = new PinoLogger();
    this.logger = pinoLogger.getLogger();

    this.logger.debug("App logger initialized");

    /* load application configurations */
    const configObject = new AppConfigs();
    this.config = configObject.serveConfigs();

    this.logger.debug("App configurations initialized");
  }

  public async start() {
    this.httpServer = this.app.listen(this.config.server.port, () => {
      this.logger.info(
        `application is running on port ${this.config.server.port}`,
      );
    });
  }
}
