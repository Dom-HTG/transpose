import express from "express";
import { IncomingMessage, ServerResponse, Server } from "http";
import pino from "pino";
import { BaseConfig, AppConfigs } from "./config/app.config";
import { DatabaseClient } from "./infrastructure/database/client/database";
import { PinoLogger } from "./lib/logger/logger";
import { errorHandler } from "./lib/errors/errorHandler";
import { AgentManager } from "./infrastructure/agent/agent";
import { ValidationError } from "./lib/errors/error";
import { Runnable } from "@langchain/core/runnables";
import {
  ToolInput,
  ToolOrchestrator,
} from "./internal/ochestrator/agentOchestrator";
import { MCPTools } from "./internal/mcp/tools";
import { BullMQClient } from "./infrastructure/queue-cache/bullmq.client";
import { WalletWorker } from "./app/workers/wallet.worker";
import { TransactionWorker } from "./app/workers/transaction.worker";
import { SwapWorker } from "./app/workers/swap.worker";
import { baseSchema } from "./infrastructure/agent/schema";

interface ChatRequestBody {
  query?: string;
}

export class AppServer {
  /* start express application */
  private app: express.Application = express();
  private dbClient!: DatabaseClient;
  private bullmq!: BullMQClient;
  private config!: BaseConfig;
  private logger!: pino.Logger;
  private ochestrator!: ToolOrchestrator;
  private walletWorker!: WalletWorker;
  private transactionWorker!: TransactionWorker;
  private swapWorker!: SwapWorker;

  constructor() {
    this.registerMiddlewareStack();

    /* loge every request made */
    this.app.use(
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        this.logger.debug(`${req.method} ${req.url}`);
        this.logger.debug({ body: req.body }, "incoming request body");
        next();
      },
    );
  }

  public async bootstrapDependencies() {
    /* initialize application logger */
    const pinoLogger = new PinoLogger();
    this.logger = pinoLogger.getLogger();
    this.logger.debug("application logger initialized");

    /* load application configurations */
    const configObject = new AppConfigs();
    this.config = configObject.serveConfigs();
    this.logger.debug("application config initialized");

    /* connect to database */
    this.dbClient = new DatabaseClient(this.logger, this.config);
    await this.dbClient.connect();

    const dataSource = this.dbClient.getDataSource(); // retrieve TypeORM DataSource.

    /* initialize BullMQ client and queues */
    this.bullmq = new BullMQClient(this.logger, this.config);
    this.logger.debug("BullMQ client initialized");

    /* initialize workers */
    this.walletWorker = new WalletWorker(this.logger, dataSource);
    this.transactionWorker = new TransactionWorker(this.logger, dataSource);
    this.swapWorker = new SwapWorker(this.logger, dataSource);

    /* register workers with queues */
    this.bullmq.createWorker(
      "wallet-provisioning",
      async (job) => await this.walletWorker.process(job),
    );

    this.bullmq.createWorker(
      "transaction-processing",
      async (job) => await this.transactionWorker.process(job),
    );

    this.bullmq.createWorker(
      "swap-processing",
      async (job) => await this.swapWorker.process(job),
    );

    this.logger.debug("Workers registered and started");

    /* bootstrap MCP tools */
    const mcpTools = new MCPTools(
      this.logger,
      dataSource,
      this.bullmq.walletQueue,
      this.bullmq.transactionQueue,
      this.bullmq.swapQueue,
    );

    /* bootstrap tool orchestrator */
    this.ochestrator = new ToolOrchestrator(mcpTools);

    /* bootstrap agent */
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
    chain: Runnable<{ input: string }, ToolInput>,
  ) {
    /* chat route */
    this.app.post(
      "/chat",
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { query: userQuery, userId } = req.body as ChatRequestBody & {
            userId?: string;
          };
          if (!userQuery)
            throw new ValidationError("user query was not received");

          const response = await chain.invoke({
            input: userQuery,
          });

          this.logger.debug(response, "LangChain response");

          let parsedResponse: ToolInput;

          /* parse AI response [JSON] */
          if ("content" in response && response.content) {
            const rawContent = response.content;
            let cleanedContent: string | object;

            // Strip markdown code fences if present (only for strings)
            if (typeof rawContent === "string") {
              cleanedContent = rawContent.trim();
              // Remove ```json\n{...}\n``` or ```\n{...}\n```
              cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
              cleanedContent = cleanedContent.trim();
            } else {
              cleanedContent = rawContent;
            }

            const json = typeof cleanedContent === "string" ? JSON.parse(cleanedContent) : cleanedContent;

            parsedResponse = baseSchema.parse(json) as ToolInput;
          } else {
            throw new Error("failed to parse AI response");
          }

          /* invoke orchestrator with userId for authenticated actions */
          const result = await this.ochestrator.mapTool(parsedResponse, userId);

          this.logger.debug(result, "orchestrator result");

          // return value
          res.status(200).json({
            success: true,
            action: parsedResponse.action,
            data: result,
          });
        } catch (e: any) {
          this.logger.error({ err: e }, "Error in /chat route");
          next(e);
        }
      },
    );

    /* Queue metrics endpoint */
    this.app.get("/metrics/queues", async (_req, res, next) => {
      try {
        const metrics = {
          wallet: await this.bullmq.getQueueMetrics("wallet"),
          transaction: await this.bullmq.getQueueMetrics("transaction"),
          swap: await this.bullmq.getQueueMetrics("swap"),
          notification: await this.bullmq.getQueueMetrics("notification"),
        };

        res.status(200).json({ success: true, metrics });
      } catch (e) {
        next(e);
      }
    });

    /* Health check endpoint */
    this.app.get("/health", (_req, res) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        availableTools: this.ochestrator.getAvailableTools(),
      });
    });
  }

  private registerMiddlewareStack() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private registerErrorHandler() {
    this.app.use(errorHandler);
  }

  private async gracefulShutdown(
    signal: string,
    serverInstance: Server<typeof IncomingMessage, typeof ServerResponse>,
  ) {
    this.logger.debug(`Signal [${signal}] received, shutting down application`);

    /* set timeout to 10s */
    const timeout = setTimeout(() => {
      process.exit(1);
    }, 1000);

    try {
      /* disconnect database */
      this.dbClient.disconnect();

      /* close BullMQ queues and workers */
      if (this.bullmq) {
        await this.bullmq.closeAll();
      }

      /* close server */
      serverInstance.close(() => {
        clearTimeout(timeout);
        this.logger.debug("shutdown application server complete");
      });
    } catch (e) {
      clearTimeout(timeout);
      this.logger.error(
        e,
        "failed to shutdown gracfully. force shut down starting...",
      );
      process.exit(1);
    }
  }
}
