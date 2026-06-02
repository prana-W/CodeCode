import {ApiResponse} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const errorHandler = () => {
    return (err, req, res, next) => {
        console.error(err.stack);

        return res
            .status(err.statusCode || statusCode.INTERNAL_SERVER_ERROR)
            .json(
                new ApiResponse(
                    err.statusCode || statusCode.INTERNAL_SERVER_ERROR,
                    err.message || 'Internal Server Error'
                )
            );
    };
};

export default errorHandler;
