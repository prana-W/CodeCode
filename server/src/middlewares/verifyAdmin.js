import { ApiError } from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

/**
 * Middleware that blocks any request where req.role !== 'admin'.
 * Must be used AFTER verifyToken.
 */
const verifyAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return next(new ApiError(statusCode.FORBIDDEN, 'Admin access required.'));
    }
    next();
};

export { verifyAdmin };
