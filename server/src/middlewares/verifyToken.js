import { ApiError } from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    try {
        const token = req?.cookies?.token;

        if (!token || token === 'null') {
            throw new ApiError(statusCode.UNAUTHORIZED, 'Token is missing!');
        }

        const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!verifiedToken) {
            throw new ApiError(statusCode.UNAUTHORIZED, 'Token validation error!');
        }

        // Attach full user context to the request
        req.userId   = verifiedToken.userId;
        req.username = verifiedToken.username;
        req.role     = verifiedToken.role;

        next();
    } catch (error) {
        // Handle jwt-specific errors with clearer messages
        if (error.name === 'TokenExpiredError') {
            return next(new ApiError(statusCode.UNAUTHORIZED, 'Token has expired.'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new ApiError(statusCode.UNAUTHORIZED, 'Invalid token.'));
        }
        next(error instanceof ApiError ? error : new ApiError(statusCode.UNAUTHORIZED, error.message));
    }
};

export { verifyToken };
