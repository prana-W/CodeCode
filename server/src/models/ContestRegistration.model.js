import pool from '../db/db.js';

class ContestRegistration {
    static async register({contest_id, user_id}) {
        const [result] = await pool.query(
            `INSERT INTO contest_registrations (contest_id, user_id) VALUES (?, ?)`,
            [contest_id, user_id]
        );
        return result.insertId;
    }

    static async findByUserAndContest(contest_id, user_id) {
        const [rows] = await pool.query(
            `SELECT cr.registration_id, cr.contest_id, cr.user_id, cr.registered_at,
                    c.contest_start_time, c.contest_end_time, c.authored_by AS contest_authored_by
             FROM contest_registrations cr
             JOIN contests c ON cr.contest_id = c.id
             WHERE cr.contest_id = ? AND cr.user_id = ?`,
            [contest_id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findContestTimes(contest_id) {
        const [rows] = await pool.query(
            `SELECT id, contest_start_time, contest_end_time, authored_by AS contest_authored_by
             FROM contests WHERE id = ?`,
            [contest_id]
        );
        return rows[0] ?? null;
    }

    // Returns all participants for a contest with their current rating and final score
    static async getParticipantsWithRating(contest_id) {
        const [rows] = await pool.query(
            `SELECT
                cr.user_id,
                u.rating                                                                AS currentRating,
                COALESCE(SUM(p.score), 0)                                               AS total_score,
                COALESCE(
                    SUM(TIMESTAMPDIFF(MINUTE, c.contest_start_time, s.submitted_at)),
                    0
                )                                                                       AS total_penalty,
                COALESCE(SUM(p.score), 0) -
                COALESCE(
                    SUM(TIMESTAMPDIFF(MINUTE, c.contest_start_time, s.submitted_at)),
                    0
                )                                                                       AS final_score
             FROM contest_registrations cr
             JOIN users    u  ON cr.user_id               = u.id
             JOIN contests c  ON cr.contest_id             = c.id
             LEFT JOIN contest_standings  cs ON cs.contest_id = cr.contest_id
                                             AND cs.user_id   = cr.user_id
             LEFT JOIN problems   p  ON cs.problem_id             = p.problem_id
             LEFT JOIN submissions s ON cs.accepted_submission_id = s.submission_id
             WHERE cr.contest_id = ?
             GROUP BY cr.user_id, u.rating, c.contest_start_time
             ORDER BY final_score DESC`,
            [contest_id]
        );
        return rows;
    }

    static async updateDelta(conn, contest_id, user_id, delta) {
        await conn.query(
            `UPDATE contest_registrations
             SET delta = ?
             WHERE contest_id = ? AND user_id = ?`,
            [delta, contest_id, user_id]
        );
    }
}

export default ContestRegistration;
