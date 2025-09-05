import express from 'express';
import { ApplicationError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ForbiddenError, RateLimitError, InternalServerError} from './error';

export function errorHandler(
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        /* unhandled errors */
        if (!(err instanceof ApplicationError)) {
            return res.status(500).json({
                type: 'UNCAUGHT_ERROR',
                success: false,
                message: err.message
            });
        };

        
        /* output errors based on error types */
        switch (err.constructor) {
            case ValidationError:
                return  res.status(err.statusCode).json({
                type: 'VALIDATION_ERROR',
                success: false,
                message: err.message
                });

            case AuthenticationError:
                return res.status(err.statusCode).json({
                    type: 'AUTHENTICATION_ERROR',
                    success: false,
                    message: err.message
                });

            case AuthorizationError:
                return res.status(err.statusCode).json({
                    type: 'AUTHORIZATION_ERROR',
                    success: false,
                    message: err.message
                });

            case NotFoundError:
                return res.status(err.statusCode).json({
                    type: 'NOTFOUND_ERROR',
                    success: false,
                    message: err.message
                });

            case ForbiddenError:
                return res.status(err.statusCode).json({
                    type: 'FORBIDDEN_ERROR',
                    success: false,
                    message: err.message
                });

            case RateLimitError: 
                return res.status(err.statusCode).json({
                    types: 'RATELIMIT_ERROR',
                    success: false,
                    message: err.message
                });

            case InternalServerError:
                return res.status(err.statusCode).json({
                    type: 'INTERNAL_SERVER_ERROR',
                    success: false,
                    message: err.message
                });
        };
    }