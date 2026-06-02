import {ApiError, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import jwt from 'jsonwebtoken';
import cookieOptions from '../constants/cookieOptions.js';

// Todo: Kindly verify this
const verifyAccessToken = async (req, res, next) => {
    try {
        const accessToken = req?.cookies?.accessToken;

        if (!accessToken || accessToken === 'null') {
            throw new ApiError(
                statusCode.UNAUTHORIZED,
                'Access token is missing!'
            );
        }

        const verifiedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        if (!verifiedToken) {
            throw new ApiError(
                statusCode.UNAUTHORIZED,
                'Access token validation error!'
            );
        }

        req.userId = verifiedToken?.userId;
        next();
    } catch (error) {
        next(new ApiError(statusCode.UNAUTHORIZED, error));
    }
};

export {verifyAccessToken};
