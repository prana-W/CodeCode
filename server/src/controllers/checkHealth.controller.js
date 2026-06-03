import {asyncHandler, ApiResponse} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import pool from '../db/db.js';

const checkHealth = asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT current_timestamp()');

    return res.json(
        new ApiResponse(statusCode.OK, 'Server is running!', {
            serverTime: new Date(),
            databaseTime: rows[0]['current_timestamp()'],
            message: 'To view api documentation, visit /api-docs'
        })
    );
});

export default checkHealth;
