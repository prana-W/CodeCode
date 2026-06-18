import pool from '../db/db.js';

class ContestStanding {
    static async getLeaderboard(contest_id, page = 1, limit = 50) {
        const offset = (page - 1) * limit;

        // Get total count of distinct participants
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(DISTINCT user_id) AS total FROM contest_standings WHERE contest_id = ?`,
            [contest_id]
        );

        const [rows] = await pool.query(
            `SELECT
                cs.user_id,
                u.username,
                u.name,
                cr.delta,
                COUNT(cs.problem_id)                                                    AS problems_solved,
                SUM(p.score)                                                            AS total_score,
                SUM(TIMESTAMPDIFF(MINUTE, c.contest_start_time, s.submitted_at))       AS total_penalty_minutes,
                SUM(p.score) - SUM(TIMESTAMPDIFF(MINUTE, c.contest_start_time, s.submitted_at)) AS final_score,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'problem_id', cs.problem_id,
                        'score', p.score,
                        'penalty_minutes', TIMESTAMPDIFF(MINUTE, c.contest_start_time, s.submitted_at)
                    )
                ) AS solved_problems
             FROM contest_standings cs
             JOIN users      u  ON cs.user_id               = u.id
             JOIN problems   p  ON cs.problem_id             = p.problem_id
             JOIN submissions s ON cs.accepted_submission_id = s.submission_id
             JOIN contests    c  ON cs.contest_id             = c.id
             LEFT JOIN contest_registrations cr ON cr.contest_id = cs.contest_id AND cr.user_id = cs.user_id
             WHERE cs.contest_id = ?
             GROUP BY cs.user_id, u.username, u.name, cr.delta
             ORDER BY final_score DESC
             LIMIT ? OFFSET ?`,
            [contest_id, limit, offset]
        );
        return { rows, total: Number(total) };
    }
}

export default ContestStanding;
