import pino from "pino";
import { DataSource } from "typeorm";
import {
  AuthService,
  SignupEmailDTO,
  LoginEmailDTO,
  AuthResult,
} from "./auth.service";
import { WalletService } from "./wallet/wallet.service";
import { Queue } from "bullmq";

export interface OnboardingResult extends AuthResult {
  walletProvisionJobId?: string | undefined;
}

/**
 * OnboardingService
 * Orchestrates user signup/login and wallet provisioning
 * This is the main entry point for onboarding workflows
 */
export class OnboardingService {
  logger: pino.Logger;
  dataSource: DataSource;
  private authService: AuthService;
  private walletService: WalletService;
  private walletQueue: Queue | null = null;

  constructor(
    private applogger: pino.Logger,
    appDataSource: DataSource,
    walletQueue?: Queue,
  ) {
    this.logger = applogger;
    this.dataSource = appDataSource;
    this.authService = new AuthService(this.logger, this.dataSource);
    this.walletService = new WalletService(this.logger, this.dataSource);
    this.walletQueue = walletQueue ?? null;
  }

  /**
   * Complete email signup flow
   * 1. Create user account
   * 2. Enqueue wallet provisioning job
   */
  public async signupWithEmail(
    data: SignupEmailDTO,
    chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum" = "Base",
  ): Promise<OnboardingResult> {
    try {
      this.logger.info("Starting email signup flow");

      // Validate input
      if (!data.email?.trim() || !data.password?.trim()) {
        throw new Error("Email and password cannot be empty");
      }

      // Step 1: Create user account
      const authResult = await this.authService.signupWithEmail(data);

      // Step 2: Enqueue wallet provisioning job (async)
      let walletProvisionJobId: string | undefined = undefined;

      if (this.walletQueue) {
        const job = await this.walletQueue.add("provisionWallet", {
          userId: authResult.user.id,
          chain,
        });

        walletProvisionJobId = job.id;
        this.logger.info(
          `Wallet provisioning job enqueued: ${walletProvisionJobId}`,
        );
      } else {
        this.logger.warn(
          "Wallet queue not available, skipping wallet provisioning",
        );
      }

      return {
        ...authResult,
        walletProvisionJobId,
      };
    } catch (error) {
      this.logger.error({ error }, "Error in signupWithEmail");
      throw error;
    }
  }

  /**
   * Complete email login flow
   * Returns user info and checks wallet status
   */
  public async signinWithEmail(data: LoginEmailDTO): Promise<OnboardingResult> {
    try {
      this.logger.info("Starting email signin flow");

      // Validate input
      if (!data.email?.trim() || !data.password?.trim()) {
        throw new Error("Email and password cannot be empty");
      }

      // Authenticate user
      const authResult = await this.authService.signinWithEmail(data);

      // Check if user has a primary wallet
      const wallets = await this.walletService.findUserWallets(
        authResult.user.id,
      );

      this.logger.info(
        `User ${authResult.user.id} logged in with ${wallets.length} wallet(s)`,
      );

      return authResult;
    } catch (error) {
      this.logger.error({ error }, "Error in signinWithEmail");
      throw error;
    }
  }

  /**
   * OAuth signup flow (placeholder)
   */
  public async oauthSignup(
    provider: string,
    providerToken: string,
    email: string,
    chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum" = "Base",
  ): Promise<OnboardingResult> {
    try {
      this.logger.info(`Starting OAuth signup with provider: ${provider}`);

      // Step 1: Create user via OAuth
      const authResult = await this.authService.oauthSignup(
        provider,
        providerToken,
        email,
      );

      // Step 2: Enqueue wallet provisioning
      let walletProvisionJobId: string | undefined;

      if (this.walletQueue) {
        const job = await this.walletQueue.add("provisionWallet", {
          userId: authResult.user.id,
          chain,
        });

        walletProvisionJobId = job.id;
        this.logger.info(
          `Wallet provisioning job enqueued: ${walletProvisionJobId}`,
        );
      }

      return {
        ...authResult,
        walletProvisionJobId,
      };
    } catch (error) {
      this.logger.error({ error }, "Error in oauthSignup");
      throw error;
    }
  }

  /**
   * OAuth signin flow (placeholder)
   */
  public async oauthSignin(
    provider: string,
    providerToken: string,
  ): Promise<OnboardingResult> {
    try {
      this.logger.info(`Starting OAuth signin with provider: ${provider}`);

      const authResult = await this.authService.oauthSignin(
        provider,
        providerToken,
      );

      return authResult;
    } catch (error) {
      this.logger.error({ error }, "Error in oauthSignin");
      throw error;
    }
  }

  /**
   * Check wallet provisioning status
   */
  public async getWalletStatus(userId: string): Promise<{
    hasWallet: boolean;
    wallets: any[];
  }> {
    try {
      const wallets = await this.walletService.findUserWallets(userId);

      return {
        hasWallet: wallets.length > 0,
        wallets: wallets.map((w) => ({
          id: w.id,
          chain: w.chain,
          address: w.smartAccountAddress,
          isPrimary: w.isPrimary,
        })),
      };
    } catch (error) {
      this.logger.error({ error }, "Error checking wallet status");
      throw error;
    }
  }
}
