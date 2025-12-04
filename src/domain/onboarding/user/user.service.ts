import pino from "pino";
import express from "express";
import bcrypt from "bcryptjs";
import {
  ValidationError,
  AuthenticationError,
} from "../../../lib/errors/error";
import { DataSource } from "typeorm";
import { User } from "../../../infrastructure/database/entities/user.entity";

interface IUser {
  id: string;
  email: string; // nullable if using wallet-only auth.
  auth: "wallet" | "email" | "oauth"; // authentication method used.
  recovery: "email" | "phone"; // user approved recovery method.
  primaryWalletAddress: string; // to be set to null initially since no wallet is provisioned yet.
  createdAt: Date;
  updatedAt: Date;
}

interface IUserIntent {
  id: string;
  ownerId: string;
  userQuery: string;
  parsedQuery: string;
  status: "pending" | "confirmed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  logger: pino.Logger;
  dataSource: DataSource;
  constructor(
    private applogger: pino.Logger,
    appDataSource: DataSource,
  ) {
    this.logger = applogger;
    this.dataSource = appDataSource;
  }

  public async signUpEmail(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        this.logger.warn("Signup failed: Missing require credentials");
        throw new ValidationError("Email and password are required for signup");
      }

      const userRepository = this.dataSource.getRepository(User);

      // check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser !== null) {
        this.logger.warn("Signup failed: User already exists with this email");
        throw new AuthenticationError("User already exists with this email");
      }

      const hashPassword = await bcrypt.hash(password, 10);

      // register new user
      const newUser = userRepository.create({
        email,
        password: hashPassword,
        auth: "email",
        recovery: "email",
        primaryWalletAddress: null,
      });

      await userRepository.save(newUser);
      this.logger.debug(`User created: ${newUser.email}`);

      this.logger.debug("User signup successful!");
      res.status(201).json({
        msg: "User registered successfully",
        user: newUser,
      });
    } catch (e) {
      next(e);
    }
  }

  public async loginUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        this.logger.warn("Login failed: Missing required credentials");
        throw new ValidationError("Email and password are required");
      }

      // fetch user from db
      const userRepository = this.dataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        this.logger.warn("Login failed: User not found");
        throw new AuthenticationError("User not found");
      }

      // compare password
      if (!user.password)
        throw new AuthenticationError("User password not found");
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        this.logger.warn("Login failed: Incorrect password");
        throw new AuthenticationError("Incorrect password");
      }

      this.logger.debug(`User logged in: ${user.email}`);

      // issue JWT or session here

      res.status(200).json({
        msg: "User logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          auth: user.auth,
          recovery: user.recovery,
          primaryWalletAddress: user.primaryWalletAddress,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (e) {
      next(e);
    }
  }
}
