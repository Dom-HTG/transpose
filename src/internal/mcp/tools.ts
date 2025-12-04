import pino from "pino";
import { DataSource } from "typeorm";
import { Queue } from "bullmq";
import {
  SignupDTO,
  SigninDTO,
  CreateAliasDTO,
  ResolveAliasDTO,
  TransferDTO,
  SwapDTO,
  BalanceCheckDTO,
  PortfolioDTO,
} from "../../infrastructure/agent/schema";
import { OnboardingService } from "../../domain/onboarding/onboarding.service";
import { AliasService } from "../../domain/alias/alias.service";
import { TransferService } from "../../domain/transaction/transaction.service";
import { SwapService } from "../../domain/swap/swap.service";
import { ValidationError } from "../../lib/errors/error";

export type ToolInput =
  | SignupDTO
  | SigninDTO
  | CreateAliasDTO
  | ResolveAliasDTO
  | TransferDTO
  | SwapDTO
  | BalanceCheckDTO
  | PortfolioDTO;

/**
 * MCPTools
 * Model Context Protocol tools that the LLM can invoke
 * Each tool routes to appropriate domain services
 */
export class MCPTools {
  private logger: pino.Logger;
  private dataSource: DataSource;
  private onboardingService: OnboardingService;
  private aliasService: AliasService;
  private transferService: TransferService;
  private swapService: SwapService;
  private transactionQueue: Queue | undefined;
  private swapQueue: Queue | undefined;

  constructor(
    appLogger: pino.Logger,
    appDataSource: DataSource,
    walletQueue?: Queue,
    transactionQueue?: Queue,
    swapQueue?: Queue,
  ) {
    this.logger = appLogger;
    this.dataSource = appDataSource;
    this.transactionQueue = transactionQueue ?? undefined;
    this.swapQueue = swapQueue ?? undefined;

    // Initialize services
    this.onboardingService = new OnboardingService(
      this.logger,
      this.dataSource,
      walletQueue,
    );
    this.aliasService = new AliasService(this.logger, this.dataSource);
    this.transferService = new TransferService(this.logger, this.dataSource);
    this.swapService = new SwapService(this.logger, this.dataSource);
  }

  /**
   * Signup Tool
   * Handles user registration with email/OAuth
   */
  public signupTool() {
    return {
      name: "signup",
      description: "Register a new user account with email/password or OAuth",
      execute: async (input: SignupDTO, userId?: string) => {
        try {
          this.logger.info({ input }, "Executing signup tool");

          if (input.provider === "email") {
            if (!input.password) {
              throw new ValidationError(
                "Password is required for email signup",
              );
            }

            const result = await this.onboardingService.signupWithEmail(
              {
                email: input.email,
                password: input.password,
              },
              input.chain,
            );

            return {
              success: true,
              message: `Account created successfully for ${input.email}. Wallet provisioning initiated on ${input.chain}.`,
              data: {
                userId: result.user.id,
                email: result.user.email,
                walletJobId: result.walletProvisionJobId,
              },
            };
          } else {
            // OAuth signup
            throw new Error(
              `OAuth provider ${input.provider} not yet implemented`,
            );
          }
        } catch (error) {
          this.logger.error({ error }, "Error in signup tool");
          return {
            success: false,
            message: error instanceof Error ? error.message : "Signup failed",
          };
        }
      },
    };
  }

  /**
   * Signin Tool
   * Handles user authentication
   */
  public signinTool() {
    return {
      name: "signin",
      description: "Authenticate and login a user",
      execute: async (input: SigninDTO, userId?: string) => {
        try {
          this.logger.info({ input }, "Executing signin tool");

          if (input.provider === "email") {
            if (!input.password) {
              throw new ValidationError("Password is required for email login");
            }

            const result = await this.onboardingService.signinWithEmail({
              email: input.email,
              password: input.password,
            });

            const walletStatus = await this.onboardingService.getWalletStatus(
              result.user.id,
            );

            return {
              success: true,
              message: `Welcome back, ${input.email}!`,
              data: {
                userId: result.user.id,
                email: result.user.email,
                hasWallet: walletStatus.hasWallet,
                wallets: walletStatus.wallets,
              },
            };
          } else {
            throw new Error(
              `OAuth provider ${input.provider} not yet implemented`,
            );
          }
        } catch (error) {
          this.logger.error({ error }, "Error in signin tool");
          return {
            success: false,
            message: error instanceof Error ? error.message : "Login failed",
          };
        }
      },
    };
  }

  /**
   * Create Alias Tool
   * Creates or updates a user alias
   */
  public createAliasTool() {
    return {
      name: "create_alias",
      description:
        "Create or update a human-readable alias for a wallet address",
      execute: async (input: CreateAliasDTO, userId?: string) => {
        try {
          this.logger.info({ input }, "Executing create_alias tool");

          if (!userId) {
            throw new ValidationError(
              "User must be authenticated to create alias",
            );
          }

          if (!input.alias?.trim() || !input.address?.trim()) {
            throw new ValidationError("Alias and address cannot be empty");
          }

          const alias = await this.aliasService.saveAlias({
            userId,
            alias: input.alias,
            address: input.address,
            ...(input.chain && { chain: input.chain }),
          });

          return {
            success: true,
            message: `Alias ${input.alias} saved for address ${input.address}`,
            data: {
              aliasId: alias.id,
              alias: alias.alias,
              address: alias.aliasAddress,
            },
          };
        } catch (error) {
          this.logger.error({ error }, "Error in create_alias tool");
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Failed to create alias",
          };
        }
      },
    };
  }

  /**
   * Resolve Alias Tool
   * Resolves an alias to a wallet address
   */
  public resolveAliasTool() {
    return {
      name: "resolve_alias",
      description: "Resolve a human-readable alias to its wallet address",
      execute: async (input: ResolveAliasDTO, userId?: string) => {
        try {
          this.logger.info({ input }, "Executing resolve_alias tool");

          if (!userId) {
            throw new ValidationError(
              "User must be authenticated to resolve alias",
            );
          }

          if (!input.alias?.trim()) {
            throw new ValidationError("Alias cannot be empty");
          }

          const address = await this.aliasService.resolveAlias({
            userId,
            alias: input.alias,
          });

          if (!address) {
            return {
              success: false,
              message: `Alias ${input.alias} not found in your contacts`,
            };
          }

          return {
            success: true,
            message: `Resolved ${input.alias} to ${address}`,
            data: {
              alias: input.alias,
              address,
            },
          };
        } catch (error) {
          this.logger.error({ error }, "Error in resolve_alias tool");
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Failed to resolve alias",
          };
        }
      },
    };
  }

  /**
   * Transfer Tool
   * Handles token transfers
   */
  public transferTool() {
    return {
      name: "transfer",
      description: "Send tokens from one wallet to another",
      execute: async (input: TransferDTO, userId?: string) => {
        try {
          this.logger.info({ input }, "Executing transfer tool");

          if (!userId) {
            throw new ValidationError("User must be authenticated to transfer");
          }

          // Validate transfer inputs
          if (!input.to?.trim()) {
            throw new ValidationError("Recipient address cannot be empty");
          }

          const amount = parseFloat(input.amount);
          if (isNaN(amount) || amount <= 0) {
            throw new ValidationError(
              "Transfer amount must be a positive number",
            );
          }

          // Resolve alias if 'to' is an alias (starts with @)
          let toAddress = input.to;
          if (input.to.startsWith("@")) {
            const resolved = await this.aliasService.resolveAlias({
              userId,
              alias: input.to,
            });
            if (!resolved) {
              throw new ValidationError(`Alias ${input.to} not found`);
            }
            toAddress = resolved;
          }

          // TODO: Create transaction record and enqueue job
          // For now, call the service directly
          this.transferService.transferToken({
            ...input,
            to: toAddress,
          });

          return {
            success: true,
            message: `Transfer initiated: ${input.amount} ${input.asset} to ${input.to} on ${input.chain}`,
            data: {
              amount: input.amount,
              asset: input.asset,
              to: toAddress,
              chain: input.chain,
            },
          };
        } catch (error) {
          this.logger.error({ error }, "Error in transfer tool");
          return {
            success: false,
            message: error instanceof Error ? error.message : "Transfer failed",
          };
        }
      },
    };
  }

  /**
   * Swap Tool
   * Handles token swaps
   */
  public swapTool() {
    return {
      name: "swap",
      description: "Exchange one token for another",
      execute: async (input: SwapDTO, userId?: string) => {
        try {
          this.logger.info({ input }, "Executing swap tool");

          if (!userId) {
            throw new ValidationError("User must be authenticated to swap");
          }

          // Validate swap inputs
          const amount = parseFloat(input.amount);
          if (isNaN(amount) || amount <= 0) {
            throw new ValidationError("Swap amount must be a positive number");
          }

          if (!input.fromAsset?.trim() || !input.toAsset?.trim()) {
            throw new ValidationError("From and to assets cannot be empty");
          }

          if (input.fromAsset === input.toAsset) {
            throw new ValidationError("Cannot swap the same asset");
          }

          // TODO: Create swap record and enqueue job
          // For now, call the service directly
          this.swapService.swapToken(input);

          return {
            success: true,
            message: `Swap initiated: ${input.amount} ${input.fromAsset} → ${input.toAsset} on ${input.chain}`,
            data: {
              fromAsset: input.fromAsset,
              toAsset: input.toAsset,
              amount: input.amount,
              protocol: input.protocol || "default",
              chain: input.chain,
            },
          };
        } catch (error) {
          this.logger.error({ error }, "Error in swap tool");
          return {
            success: false,
            message: error instanceof Error ? error.message : "Swap failed",
          };
        }
      },
    };
  }

  /**
   * Balance Check Tool
   * Checks wallet balance
   */
  public balanceCheckTool() {
    return {
      name: "balance_check",
      description: "Check token balance for a wallet",
      execute: async (input: BalanceCheckDTO, userId?: string) => {
        try {
          this.logger.info({ input }, "Executing balance_check tool");

          if (!userId) {
            throw new ValidationError(
              "User must be authenticated to check balance",
            );
          }

          // TODO: Implement actual balance checking via viem
          this.transferService.checkTokenBalance(input);

          return {
            success: true,
            message: `Balance check for ${input.asset} on ${input.chain}`,
            data: {
              asset: input.asset,
              balance: "0.00", // Placeholder
              chain: input.chain,
            },
          };
        } catch (error) {
          this.logger.error({ error }, "Error in balance_check tool");
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Balance check failed",
          };
        }
      },
    };
  }

  /**
   * Portfolio Tool
   * Views portfolio data
   */
  public portfolioTool() {
    return {
      name: "portfolio",
      description: "View portfolio balances, activity, or pulse summary",
      execute: async (input: PortfolioDTO, userId?: string) => {
        try {
          this.logger.info({ input }, "Executing portfolio tool");

          if (!userId) {
            throw new ValidationError(
              "User must be authenticated to view portfolio",
            );
          }

          // TODO: Implement portfolio service
          return {
            success: true,
            message: `Portfolio ${input.view} retrieved`,
            data: {
              view: input.view,
              balances: [], // Placeholder
              activity: [], // Placeholder
            },
          };
        } catch (error) {
          this.logger.error({ error }, "Error in portfolio tool");
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Portfolio fetch failed",
          };
        }
      },
    };
  }
}
