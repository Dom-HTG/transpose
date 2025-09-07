import express from "express";
import { IncomingMessage, ServerResponse, Server } from "http";
import pino from "pino";
import { BaseConfig, AppConfigs } from "./config/app.config";
import { PinoLogger } from "./lib/logger/logger";
import { errorHandler } from "./lib/errors/errorHandler";
import { AgentManager } from "./infrastructure/agent/agent";
import { ValidationError } from "./lib/errors/error";
import { Runnable } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";

interface ChatRequestBody {
  query?: string;
}

export class AppServer {
  /* start express application */
  private app: express.Application = express();
  private httpServer: any;
  private config: BaseConfig;
  private logger: pino.Logger;

  constructor() {
    this.registerMiddlewareStack();

    /* loge every request made */
    this.app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        this.logger.debug(`${req.method} ${req.url}`);
        this.logger.debug({ body: req.body }, "incoming request body");
        next();
      },
    );

    /* initialize application logger */
    const pinoLogger = new PinoLogger();
    this.logger = pinoLogger.getLogger();

    this.logger.debug("App logger initialized");

    /* load application configurations */
    const configObject = new AppConfigs();
    this.config = configObject.serveConfigs();

    this.logger.debug("App configurations initialized");

    /* boostrap agent */
    const agent = new AgentManager(this.config);
    const chain = agent.getChain();

    /* app routes */
    this.registerApplicationTestRoutes(chain);

    /* error handler */
    this.registerErrorHandler();
  }

  public start() {
    const serverInstance = this.app.listen(this.config.server.port, () => {
      this.logger.info(
        `application is running on port ${this.config.server.port}`,
      );
    });

    process.on("SIGTERM", () =>
      this.gracefulShutdown("SIGTERM", serverInstance),
    );
    process.on("SIGINT", () => this.gracefulShutdown("SIGINT", serverInstance));
  }

  /* temp */
  private registerApplicationTestRoutes(
    chain: Runnable<{ input: string }, AIMessage>,
  ) {
    this.app.post(
      "/chat",
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { query: userQuery } = req.body as ChatRequestBody;
          if (!userQuery)
            throw new ValidationError("user query was not received");

          const response = await chain.invoke({
            input: userQuery,
          });

          this.logger.debug(response, "LangChain response"); // temp

          let result: string;

          if (typeof response === "string") {
            result = response;
          } else if ("content" in response) {
            result = (response as any).content;
          } else {
            result = JSON.stringify(response);
          }

          // return value
          res.status(200).json({
            success: true,
            data: result,
          });
        } catch (e: any) {
          this.logger.error({ err: e }, "Error in /chat route");
          next(e);
        }
      },
    );
  }

  private registerMiddlewareStack() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private registerErrorHandler() {
    this.app.use(errorHandler);
  }

  private gracefulShutdown(
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
