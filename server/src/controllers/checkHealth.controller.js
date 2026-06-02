import {asyncHandler, ApiResponse} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import pool from "../db/db.js";

const checkHealth = asyncHandler(async (req, res) => {

    const [rows] = await pool.query("SELECT 1");

    console.log(rows);

    return res.json(new ApiResponse(statusCode.OK, 'Server is running!'));

});



export default checkHealth;
