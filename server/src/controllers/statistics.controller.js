import pool from '../db/db.js';
import {asyncHandler, ApiResponse} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import Contest from '../models/Contest.model.js';

const getStatistics = asyncHandler(async (req, res) => {
    // Run all count queries in parallel for better performance
    const [usersResult, contestsResult, problemsResult, submissionsResult, upcomingContests] = await Promise.all([
        pool.query('SELECT COUNT(*) AS count FROM users'),
        pool.query('SELECT COUNT(*) AS count FROM contests WHERE isVerified = 1'),
        pool.query('SELECT COUNT(*) AS count FROM problems'),
        pool.query('SELECT COUNT(*) AS count FROM submissions'),
        Contest.getUpcomingPublic(),
    ]);

    const totalUsers = usersResult[0][0].count;
    const totalContests = contestsResult[0][0].count;
    const totalProblems = problemsResult[0][0].count;
    const totalSubmissions = submissionsResult[0][0].count;

    return res.status(statusCode.OK).json(
        new ApiResponse(statusCode.OK, 'Statistics fetched successfully', {
            totalUsers: Number(totalUsers),
            totalContests: Number(totalContests),
            totalProblems: Number(totalProblems),
            totalSubmissions: Number(totalSubmissions),
            upcomingContests,
        })
    );
});

export {getStatistics};
