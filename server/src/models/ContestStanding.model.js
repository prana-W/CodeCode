import pool from '../db/db.js';

class ContestStanding {
    static async getLeaderboard(contest_id) {
        const [rows] = await pool.query(
            `SELECT
                cs.user_id,
                u.username,
                u.name,
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
             WHERE cs.contest_id = ?
             GROUP BY cs.user_id, u.username, u.name
             ORDER BY final_score DESC`,
            [contest_id]
        );
        return rows;
    }
}

export default ContestStanding;
