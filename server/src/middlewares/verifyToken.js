import {ApiError} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    try {
        const token = req?.cookies?.accessToken;

        if (!token || token === 'null') {
            throw new ApiError(statusCode.UNAUTHORIZED, 'Access token is missing!', [],
                {code: 'ACCESS_TOKEN_INVALID'})
        }

        const verifiedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        if (!verifiedToken) {
            throw new ApiError(
                statusCode.UNAUTHORIZED,
                'Access token validation error!',
                [],
                {code: 'ACCESS_TOKEN_INVALID'}
            );
        }

        // Attach full user context to the request
        req.userId = verifiedToken.userId;
        req.username = verifiedToken.username;
        req.role = verifiedToken.role;

        next();
    } catch (error) {
        // Return a distinct message so the client interceptor can identify
        // an expired access token and silently call /refresh.
        if (error.name === 'TokenExpiredError') {
            return next(
                new ApiError(statusCode.UNAUTHORIZED, 'Access token has expired.', [],
                {code: 'ACCESS_TOKEN_INVALID'})
            );
        }
        if (error.name === 'JsonWebTokenError') {
            return next(
                new ApiError(statusCode.UNAUTHORIZED, 'Invalid access token.')
            );
        }
        next(
            error instanceof ApiError
                ? error
                : new ApiError(statusCode.UNAUTHORIZED, error?.message, error?.stack, error?.data)
        );
    }
};

export {verifyToken};
