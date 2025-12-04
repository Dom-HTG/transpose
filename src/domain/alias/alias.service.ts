import pino from "pino";
import { DataSource, Repository } from "typeorm";
import { Alias } from "../../infrastructure/database/entities/alias.entity";
import { ValidationError } from "../../lib/errors/error";

export interface CreateAliasDTO {
  userId: string;
  alias: string;
  address: string;
  chain?: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";
}

export interface ResolveAliasDTO {
  userId: string;
  alias: string;
}

/**
 * AliasService
 * Manages user aliases for wallet addresses
 * Aliases are scoped per user (each user can have their own @alice)
 */
export class AliasService {
  logger: pino.Logger;
  dataSource: DataSource;
  private aliasRepository: Repository<Alias>;

  constructor(
    private applogger: pino.Logger,
    appDataSource: DataSource,
  ) {
    this.logger = applogger;
    this.dataSource = appDataSource;

    if (!this.dataSource) {
      throw new Error("DataSource is required for AliasService");
    }

    this.aliasRepository = this.dataSource.getRepository(Alias);
  }

  /**
   * Create or update an alias for a user
   */
  public async saveAlias(data: CreateAliasDTO): Promise<Alias> {
    try {
      const { userId, alias, address } = data;

      // Validate inputs
      if (!userId?.trim()) {
        throw new ValidationError("User ID is required");
      }

      if (!address?.trim()) {
        throw new ValidationError("Address is required");
      }

      // Basic Ethereum address validation (0x + 40 hex chars)
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new ValidationError("Invalid Ethereum address format");
      }

      // Validate alias format
      this.validateAliasFormat(alias);

      // Check if alias already exists for this user
      const existing = await this.aliasRepository.findOne({
        where: {
          owner: { id: userId } as any,
          alias: alias.toLowerCase(),
        },
      });

      if (existing) {
        // Update existing alias
        existing.aliasAddress = address;
        await this.aliasRepository.save(existing);
        this.logger.info(`Updated alias ${alias} for user ${userId}`);
        return existing;
      }

      // Create new alias
      const newAlias = this.aliasRepository.create({
        owner: { id: userId } as any,
        alias: alias.toLowerCase(),
        aliasAddress: address,
        isVerified: false,
      });

      await this.aliasRepository.save(newAlias);
      this.logger.info(`Created alias ${alias} for user ${userId}`);

      return newAlias;
    } catch (error) {
      this.logger.error({ error }, "Error saving alias");
      throw error;
    }
  }

  /**
   * Resolve an alias to a wallet address for a specific user
   */
  public async resolveAlias(data: ResolveAliasDTO): Promise<string | null> {
    try {
      const { userId, alias } = data;

      // Remove @ symbol if present
      const cleanAlias = alias.startsWith("@")
        ? alias.substring(1).toLowerCase()
        : alias.toLowerCase();

      const aliasRecord = await this.aliasRepository.findOne({
        where: {
          owner: { id: userId } as any,
          alias: cleanAlias,
        },
      });

      if (!aliasRecord) {
        this.logger.warn(`Alias ${cleanAlias} not found for user ${userId}`);
        return null;
      }

      this.logger.debug(
        `Resolved alias ${cleanAlias} to ${aliasRecord.aliasAddress}`,
      );
      return aliasRecord.aliasAddress;
    } catch (error) {
      this.logger.error({ error }, "Error resolving alias");
      throw error;
    }
  }

  /**
   * Get all aliases for a user
   */
  public async getUserAliases(userId: string): Promise<Alias[]> {
    try {
      const aliases = await this.aliasRepository.find({
        where: { owner: { id: userId } as any },
      });

      this.logger.debug(`Found ${aliases.length} aliases for user ${userId}`);
      return aliases;
    } catch (error) {
      this.logger.error({ error }, "Error getting user aliases");
      throw error;
    }
  }

  /**
   * Delete an alias
   */
  public async deleteAlias(userId: string, alias: string): Promise<void> {
    try {
      const cleanAlias = alias.startsWith("@")
        ? alias.substring(1).toLowerCase()
        : alias.toLowerCase();

      await this.aliasRepository.delete({
        owner: { id: userId } as any,
        alias: cleanAlias,
      });

      this.logger.info(`Deleted alias ${cleanAlias} for user ${userId}`);
    } catch (error) {
      this.logger.error({ error }, "Error deleting alias");
      throw error;
    }
  }

  /**
   * Validate alias format
   * - Must start with alphanumeric
   * - Can contain alphanumeric, underscore, hyphen
   * - Must be 3-20 characters
   */
  private validateAliasFormat(alias: string): void {
    const cleanAlias = alias.startsWith("@") ? alias.substring(1) : alias;

    // Check length
    if (cleanAlias.length < 3 || cleanAlias.length > 20) {
      throw new ValidationError("Alias must be between 3 and 20 characters");
    }

    // Check format
    const aliasRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
    if (!aliasRegex.test(cleanAlias)) {
      throw new ValidationError(
        "Alias must start with alphanumeric and contain only letters, numbers, underscores, or hyphens",
      );
    }

    // Check for reserved words
    const reserved = ["admin", "system", "root", "api", "app"];
    if (reserved.includes(cleanAlias.toLowerCase())) {
      throw new ValidationError("This alias is reserved and cannot be used");
    }
  }
}
