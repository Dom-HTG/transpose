import pino from 'pino';
import express from 'express';
import bcrypt from 'bcryptjs';
import { ValidationError } from '../../../lib/errors/error';

interface IUser {
    id: string;
    email: string; // nullable if using wallet-only auth.
    auth: "wallet" | "email" | "oauth"; // authentication method used.
    recovery: "email" | "phone"; // user approved recovery method.
    primaryWalletAddress: string; // to be set to null initially since no wallet is provisioned yet.
    createdAt: Date;
    updatedAt: Date;
};

interface IUserIntent {
    id: string;
    ownerId: string;
    userQuery: string;
    parsedQuery: string;
    status: "pending" | "confirmed" | "failed";
    createdAt: Date;
    updatedAt: Date;
};

export class UserService {
    logger: pino.Logger;
    constructor(private applogger: pino.Logger) {
        this.logger = applogger;
    }

    public async signUpUser(req: express.Request, res: express.Response) {
        
        const { email, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);

        // Database insertion logic.

        this.logger.debug('User signup successful!'); // to:remove
        res.status(200).json({
            msg: 'User signed up successfully',
        });
    }

    public loginUser(req: express.Request, res: express.Response) {
        const { email, password } = req.body;
        
        if (!email || !password) { 
            this.logger.error('Validation error: Email and password are required'); 
            throw new ValidationError('Email and password are required');
        };

        // Database lookup logic.

        this.logger.debug('User login successful!'); // to:remove
        res.status(200).json({
            msg: 'User logged in successfully',
        });
    }
}