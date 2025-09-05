import express from "express";
import { IncomingMessage, ServerResponse, Server } from "http";
import pino from "pino";
import { BaseConfig, AppConfigs } from "./config/app.config";
import { PinoLogger } from "./lib/logger/logger";
import { errorHandler } from "./lib/errors/errorHandler";
import { AgentManager } from "./infrastructure/agent/agent";

export class AppServer {
  /* start express application */
  private app: express.Application = express();
  private httpServer: any;
  private config: BaseConfig;
  private logger: pino.Logger;

  constructor() {
    this.registerMiddlewareStack();

    /* initialize application logger */
    const pinoLogger = new PinoLogger();
    this.logger = pinoLogger.getLogger();

    this.logger.debug("App logger initialized");

    /* load application configurations */
    const configObject = new AppConfigs();
    this.config = configObject.serveConfigs();

    this.logger.debug("App configurations initialized");

    /* boostrap agent */
    const agent = new AgentManager();
    const chain = agent.getChain();

    /* error handler */
    this.registerErrorHandler();
  }

  public async start(): Promise<
    Server<typeof IncomingMessage, typeof ServerResponse>
  > {
    const serverInstance = this.app.listen(this.config.server.port, () => {
      this.logger.info(
        `application is running on port ${this.config.server.port}`,
      );
    });
    return serverInstance;
  }

  private registerMiddlewareStack() {
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
  }

  private registerErrorHandler() {
    this.app.use(errorHandler);
  }

  public gracefulShutdown(
    signal: string,
    serverInstance: Server<typeof IncomingMessage, typeof ServerResponse>,
  ) {
    this.logger.debug(`Signal [${signal}] received, shutting down application`);

    /* set timeout to 10s */
    const timeout = setTimeout(() => {
      process.exit(1);
    }, 1000);

    try {
      /* close server */
      serverInstance.close(() => {
        clearTimeout(timeout);
        this.logger.debug("shutdown application server complete");
        process.exit(0);
      });
    } catch (e) {
      clearTimeout(timeout);
      this.logger.error(
        e,
        "failed to shutdown gracfully. force shut down starting",
      );
      process.exit(1);
    }
  }
}
