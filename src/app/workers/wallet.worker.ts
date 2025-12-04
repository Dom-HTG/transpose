import { Job } from "bullmq";
import pino from "pino";
import { DataSource } from "typeorm";
import {
  WalletProvisionJob,
  WalletJobResult,
  walletProvisionJobSchema,
} from "../jobs/wallet-processor.job";
import { WalletService } from "../../domain/onboarding/wallet/wallet.service";
import { User } from "../../infrastructure/database/entities/user.entity";

/**
 * Wallet Provisioning Worker
 * Processes jobs for deploying smart account wallets on-chain
 */
export class WalletWorker {
  private logger: pino.Logger;
  private walletService: WalletService;
  private dataSource: DataSource;

  constructor(appLogger: pino.Logger, appDataSource: DataSource) {
    this.logger = appLogger;
    this.dataSource = appDataSource;
    this.walletService = new WalletService(this.logger, this.dataSource);
  }

  /**
   * Process wallet provisioning job
   */
  public async process(job: Job<WalletProvisionJob>): Promise<WalletJobResult> {
    try {
      this.logger.info({ jobId: job.id }, "Processing wallet provisioning job");

      // Validate job data
      const validatedData = walletProvisionJobSchema.parse(job.data);
      const { userId, chain } = validatedData;

      // Check if user already has a primary wallet on this chain
      const existingWallet = await this.walletService.findPrimaryWallet(
        userId,
        chain,
      );
      if (existingWallet) {
        this.logger.warn(
          `User ${userId} already has a primary wallet on ${chain}`,
        );
        return {
          success: true,
          walletId: existingWallet.id,
          address: existingWallet.smartAccountAddress,
          txHash: "already_exists",
        };
      }

      // Step 1: Provision wallet on-chain
      this.logger.debug(
        `Deploying smart account for user ${userId} on ${chain}`,
      );
      const { address, txHash } = await this.walletService.provisionOnChain({
        userId,
        chain,
      });

      // Step 2: Create wallet record in database
      const wallet = await this.walletService.createWallet({
        userId,
        chain,
        smartAccountAddress: address,
        isPrimary: true, // First wallet is primary by default
      });

      // Step 3: Update user's primary wallet address
      const userRepository = this.dataSource.getRepository(User);
      await userRepository.update(userId, {
        primaryWalletAddress: address,
      });

      this.logger.info(
        `Wallet provisioned successfully for user ${userId}: ${address}`,
      );

      return {
        success: true,
        walletId: wallet.id,
        address,
        txHash,
      };
    } catch (error) {
      this.logger.error(
        { error, jobId: job.id },
        "Error processing wallet provisioning job",
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
