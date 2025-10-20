import pino from "pino";
import express from "express";
import bcrypt from "bcryptjs";
import { ValidationError } from "../../../lib/errors/error";
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
      const existingUser = userRepository.findOne({ where: { email } });
      if (existingUser !== null) {
        this.logger.warn("Signup failed: User already exists with this email");
        throw new ValidationError("User already exists with this email");
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

  public loginUser(req: express.Request, res: express.Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      this.logger.error("Validation error: Email and password are required");
      throw new ValidationError("Email and password are required");
    }

    // Database lookup logic.

    this.logger.debug("User login successful!"); // to:remove
    res.status(200).json({
      msg: "User logged in successfully",
    });
  }
}
