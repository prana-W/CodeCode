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
}

export default ContestRegistration;
