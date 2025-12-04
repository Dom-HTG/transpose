import pino from "pino";
import { DataSource, Repository } from "typeorm";
import { Wallet } from "../../../infrastructure/database/entities/wallet.entity";

export interface CreateWalletDTO {
  userId: string;
  chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";
  smartAccountAddress: string;
  isPrimary?: boolean;
}

export interface ProvisionWalletDTO {
  userId: string;
  chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";
}

/**
 * WalletService
 * Handles wallet creation, provisioning, and management
 */
export class WalletService {
  logger: pino.Logger;
  dataSource: DataSource;
  private walletRepository: Repository<Wallet>;

  constructor(
    private applogger: pino.Logger,
    appDataSource: DataSource,
  ) {
    this.logger = applogger;
    this.dataSource = appDataSource;

    if (!this.dataSource) {
      throw new Error("DataSource is required for WalletService");
    }

    this.walletRepository = this.dataSource.getRepository(Wallet);
  }

  /**
   * Create a wallet record in the database
   */
  public async createWallet(data: CreateWalletDTO): Promise<Wallet> {
    try {
      this.logger.debug({ data }, "Creating wallet record");

      const wallet = this.walletRepository.create({
        owner: { id: data.userId } as any,
        chain: data.chain,
        smartAccountAddress: data.smartAccountAddress,
        isPrimary: data.isPrimary ?? false,
        nonce: 0,
      });

      await this.walletRepository.save(wallet);
      this.logger.info(
        `Wallet created for user ${data.userId} on ${data.chain}`,
      );

      return wallet;
    } catch (error) {
      this.logger.error({ error }, "Error creating wallet");
      throw error;
    }
  }

  /**
   * Find wallets for a specific user
   */
  public async findUserWallets(userId: string): Promise<Wallet[]> {
    try {
      if (!userId?.trim()) {
        throw new Error("User ID is required to find wallets");
      }

      const wallets = await this.walletRepository.find({
        where: { owner: { id: userId } as any },
      });

      this.logger.debug(`Found ${wallets.length} wallets for user ${userId}`);
      return wallets;
    } catch (error) {
      this.logger.error({ error }, "Error finding user wallets");
      throw error;
    }
  }

  /**
   * Find primary wallet for a user on a specific chain
   */
  public async findPrimaryWallet(
    userId: string,
    chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum",
  ): Promise<Wallet | null> {
    try {
      if (!userId?.trim()) {
        throw new Error("User ID is required to find primary wallet");
      }

      if (!chain) {
        throw new Error("Chain is required to find primary wallet");
      }

      const wallet = await this.walletRepository.findOne({
        where: {
          owner: { id: userId } as any,
          chain,
          isPrimary: true,
        },
      });

      return wallet;
    } catch (error) {
      this.logger.error({ error }, "Error finding primary wallet");
      throw error;
    }
  }

  /**
   * Provision a smart account wallet on-chain (called by worker)
   */
  public async provisionOnChain(data: ProvisionWalletDTO): Promise<{
    address: string;
    txHash: string;
  }> {
    try {
      this.logger.info({ data }, "Provisioning wallet on-chain");

      // TODO: Implement actual AA wallet deployment using viem + Alchemy AA SDK
      // 1. Call factory contract to deploy smart account
      // 2. Get deployed address and tx hash
      // 3. Wait for confirmation

      // Placeholder implementation
      const mockAddress = `0x${Math.random().toString(16).substring(2, 42).padEnd(40, "0")}`;
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}`;

      this.logger.info(`Wallet provisioned: ${mockAddress}`);

      return {
        address: mockAddress,
        txHash: mockTxHash,
      };
    } catch (error) {
      this.logger.error({ error }, "Error provisioning wallet on-chain");
      throw error;
    }
  }

  /**
   * Update wallet address after on-chain deployment
   */
  public async updateWalletAddress(
    walletId: string,
    address: string,
  ): Promise<void> {
    try {
      // Validate inputs
      if (!walletId?.trim()) {
        throw new Error("Wallet ID is required");
      }

      if (!address?.trim() || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error("Invalid wallet address format");
      }

      await this.walletRepository.update(walletId, {
        smartAccountAddress: address,
      });

      this.logger.info(`Updated wallet ${walletId} with address ${address}`);
    } catch (error) {
      this.logger.error({ error }, "Error updating wallet address");
      throw error;
    }
  }

  /**
   * Set a wallet as primary
   */
  public async setPrimaryWallet(
    walletId: string,
    userId: string,
  ): Promise<void> {
    try {
      // First, unset all primary wallets for this user
      await this.walletRepository.update(
        { owner: { id: userId } as any },
        { isPrimary: false },
      );

      // Then set the specified wallet as primary
      await this.walletRepository.update(walletId, { isPrimary: true });

      this.logger.info(`Set wallet ${walletId} as primary for user ${userId}`);
    } catch (error) {
      this.logger.error({ error }, "Error setting primary wallet");
      throw error;
    }
  }
}
