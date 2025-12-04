import express from "express";
import { ZodError } from "zod";

export class ApplicationError extends Error {
  public statusCode: number;
  public errorPayload?: any;
  public isOperational: boolean;
  public stack?: string;

  constructor(
    message: string,
    statusCode = 500,
    err?: any,
    isOperational = true,
  ) {
    super(message);

    /* check for status code if any */
    this.statusCode = statusCode;

    this.isOperational = isOperational;

    /* check for error payload if any */
    if (err) this.errorPayload = err;

    /* get error stack if in development environment */
    if (process.env.NODE_ENV === "development") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/* Application child errors */

export class ValidationError extends ApplicationError {
  constructor(message: string, statusCode = 400) {
    super(message, statusCode);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string, statusCode = 401) {
    super(message, statusCode);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string, statusCode = 403) {
    super(message, statusCode);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string, statusCode = 404) {
    super(message, statusCode);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string, statusCode = 403) {
    super(message, statusCode);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string, statusCode = 429) {
    super(message, statusCode);
  }
}

export class InternalServerError extends ApplicationError {
  constructor(message: string, statusCode = 500) {
    super(message, statusCode);
  }
}

/* application blockchain (viem) errors */
export class BlockchainConnectionError extends ApplicationError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode);
  }
}
