import {ApiError} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const verifyAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return next(
            new ApiError(statusCode.FORBIDDEN, 'Admin access required.')
        );
    }
    next();
};

export {verifyAdmin};
