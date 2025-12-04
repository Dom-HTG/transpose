import pino from "pino";
import bcrypt from "bcryptjs";
import { DataSource } from "typeorm";
import { User } from "../../infrastructure/database/entities/user.entity";
import { ValidationError, AuthenticationError } from "../../lib/errors/error";

export interface SignupEmailDTO {
  email: string;
  password: string;
}

export interface LoginEmailDTO {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string | null;
    auth: "wallet" | "email" | "oauth";
    recovery: "email" | "phone";
    primaryWalletAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken?: string;
  refreshToken?: string;
}

/**
 * AuthService
 * Handles email/OAuth authentication, password hashing, and JWT token generation
 */
export class AuthService {
  logger: pino.Logger;
  dataSource: DataSource;

  constructor(
    private applogger: pino.Logger,
    appDataSource: DataSource,
  ) {
    this.logger = applogger;
    this.dataSource = appDataSource;
  }

  /**
   * Sign up a new user with email and password
   */
  public async signupWithEmail(data: SignupEmailDTO): Promise<AuthResult> {
    try {
      const { email, password } = data;

      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format");
      }

      // Validate password strength (min 8 chars)
      if (password.length < 8) {
        throw new ValidationError(
          "Password must be at least 8 characters long",
        );
      }

      const userRepository = this.dataSource.getRepository(User);

      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new AuthenticationError("User already exists with this email");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = userRepository.create({
        email,
        password: hashedPassword,
        auth: "email",
        recovery: "email",
        primaryWalletAddress: null,
      });

      await userRepository.save(newUser);
      this.logger.info(`User created via email signup: ${newUser.email}`);

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          auth: newUser.auth,
          recovery: newUser.recovery,
          primaryWalletAddress: newUser.primaryWalletAddress,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error({ error }, "Error in signupWithEmail");
      throw error;
    }
  }

  /**
   * Sign in a user with email and password
   */
  public async signinWithEmail(data: LoginEmailDTO): Promise<AuthResult> {
    try {
      const { email, password } = data;

      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }

      const userRepository = this.dataSource.getRepository(User);

      // Find user
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        throw new AuthenticationError("Invalid email or password");
      }

      // Verify password
      if (!user.password) {
        throw new AuthenticationError("Invalid authentication method");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError("Invalid email or password");
      }

      this.logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          auth: user.auth,
          recovery: user.recovery,
          primaryWalletAddress: user.primaryWalletAddress,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        // TODO: Generate JWT tokens here when implementing session management
        // accessToken: this.generateAccessToken(user.id),
        // refreshToken: this.generateRefreshToken(user.id),
      };
    } catch (error) {
      this.logger.error({ error }, "Error in signinWithEmail");
      throw error;
    }
  }

  /**
   * OAuth signup (placeholder for Google, GitHub, etc.)
   */
  public async oauthSignup(
    provider: string,
    providerToken: string,
    email: string,
  ): Promise<AuthResult> {
    this.logger.info(`OAuth signup initiated with provider: ${provider}`);

    // TODO: Implement OAuth validation with provider
    // TODO: Validate providerToken with OAuth provider API
    // TODO: Create or fetch user based on OAuth profile

    throw new Error("OAuth signup not yet implemented");
  }

  /**
   * OAuth signin (placeholder for Google, GitHub, etc.)
   */
  public async oauthSignin(
    provider: string,
    providerToken: string,
  ): Promise<AuthResult> {
    this.logger.info(`OAuth signin initiated with provider: ${provider}`);

    // TODO: Implement OAuth validation with provider
    // TODO: Validate providerToken and fetch user

    throw new Error("OAuth signin not yet implemented");
  }

  /**
   * Generate JWT access token (placeholder)
   */
  private generateAccessToken(userId: string): string {
    // TODO: Implement JWT token generation with proper expiry (15 minutes)
    this.logger.debug(`Generating access token for user: ${userId}`);
    return `access_token_${userId}`;
  }

  /**
   * Generate refresh token (placeholder)
   */
  private generateRefreshToken(userId: string): string {
    // TODO: Implement refresh token generation with proper expiry (7 days)
    // TODO: Store refresh token in database or Redis
    this.logger.debug(`Generating refresh token for user: ${userId}`);
    return `refresh_token_${userId}`;
  }
}
