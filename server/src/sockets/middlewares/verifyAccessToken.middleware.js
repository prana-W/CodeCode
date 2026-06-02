import jwt from 'jsonwebtoken';
import {ApiError} from '../../utility/index.js';
import statusCode from '../../constants/statusCode.js';

// Check for accessToken in the socket auth object and verify it
const verifyAccessToken = () => {
    return async (socket, next) => {
        try {
            const accessToken = socket.handshake.auth?.accessToken;

            if (!accessToken) {
                const err = new Error('Access token is missing!');
                err.data = {
                    content:
                        'Please provide a access token to connect with the server',
                };
                throw err;
            }

            const verifiedToken = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET
            );

            if (!verifiedToken) {
                throw new Error('Access token verification failed!');
            }

            socket.userId = verifiedToken?.userId;
            next();
        } catch (error) {
            next(
                new ApiError(
                    statusCode.UNAUTHORIZED,
                    error.message,
                    [],
                    error?.stack
                )
            );
        }
    };
};

export default verifyAccessToken;
