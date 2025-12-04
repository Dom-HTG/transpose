import {
  Queue,
  Worker,
  QueueOptions,
  WorkerOptions,
  ConnectionOptions,
} from "bullmq";
import pino from "pino";
import { BaseConfig } from "../../config/app.config";

/**
 * BullMQClient
 * Manages Redis-backed job queues using BullMQ
 * Provides named queues for different job types
 */
export class BullMQClient {
  private logger: pino.Logger;
  private connection: ConnectionOptions;
  public walletQueue: Queue;
  public transactionQueue: Queue;
  public swapQueue: Queue;
  public notificationQueue: Queue;

  constructor(appLogger: pino.Logger, config: BaseConfig) {
    this.logger = appLogger;
    this.logger.info("Initializing BullMQ Client...");

    // Validate Redis config
    if (!config.redis.host || !config.redis.port) {
      throw new Error("Redis host and port are required for BullMQ");
    }

    // Redis connection config
    this.connection = {
      host: config.redis.host,
      port: config.redis.port,
      ...(config.redis.password && { password: config.redis.password }),
    };

    const queueOptions: QueueOptions = {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep up to 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    };

    // Initialize queues
    this.walletQueue = new Queue("wallet-provisioning", queueOptions);
    this.transactionQueue = new Queue("transaction-processing", queueOptions);
    this.swapQueue = new Queue("swap-processing", queueOptions);
    this.notificationQueue = new Queue("notifications", queueOptions);

    this.logger.info("BullMQ queues initialized");
  }

  /**
   * Get a specific queue by name
   */
  public getQueue(
    name: "wallet" | "transaction" | "swap" | "notification",
  ): Queue {
    const queueMap = {
      wallet: this.walletQueue,
      transaction: this.transactionQueue,
      swap: this.swapQueue,
      notification: this.notificationQueue,
    };

    const queue = queueMap[name];
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    return queue;
  }

  /**
   * Create a worker for a specific queue
   */
  public createWorker(
    queueName: string,
    processor: (job: any) => Promise<any>,
    options?: Partial<WorkerOptions>,
  ): Worker {
    const worker = new Worker(queueName, processor, {
      connection: this.connection,
      ...options,
    });

    worker.on("completed", (job) => {
      this.logger.info(`Job ${job.id} in queue ${queueName} completed`);
    });

    worker.on("failed", (job, err) => {
      this.logger.error(
        { err, jobId: job?.id },
        `Job in queue ${queueName} failed`,
      );
    });

    this.logger.info(`Worker created for queue: ${queueName}`);
    return worker;
  }

  /**
   * Close all queue connections gracefully
   */
  public async closeAll(): Promise<void> {
    this.logger.info("Closing BullMQ connections...");

    await Promise.all([
      this.walletQueue.close(),
      this.transactionQueue.close(),
      this.swapQueue.close(),
      this.notificationQueue.close(),
    ]);

    this.logger.info("All BullMQ connections closed");
  }

  /**
   * Get queue metrics
   */
  public async getQueueMetrics(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName as any);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
