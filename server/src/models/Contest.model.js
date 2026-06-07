import pool from '../db/db.js';

class Contest {
    static async create({
        title,
        description,
        authored_by,
        contest_start_time,
        contest_end_time,
        division,
        ai_assistance,
    }) {
        const [result] = await pool.query(
            `INSERT INTO contests (title, description, authored_by, contest_start_time, contest_end_time, division, ai_assistance)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                description ?? null,
                authored_by,
                contest_start_time,
                contest_end_time,
                division,
                ai_assistance ?? false,
            ]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM contests WHERE id = ?', [
            id,
        ]);
        return rows[0];
    }

    static async findByIdWithAuthor(id) {
        const [rows] = await pool.query(
            `SELECT c.*, u.name AS authored_by_name
             FROM contests c
             JOIN users u ON c.authored_by = u.id
             WHERE c.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.query(
            `SELECT c.id, c.title, c.authored_by, c.division, c.description, c.isVerified, c.contest_start_time, c.contest_end_time, c.contest_evaluation, c.ai_assistance, u.name AS authored_by_name
             FROM contests c
             JOIN users u ON c.authored_by = u.id`
        );
        return rows;
    }

    static async findByAuthor(userId) {
        const [rows] = await pool.query(
            `SELECT c.id, c.title, c.division, c.description, c.isVerified,
                    c.contest_start_time, c.contest_end_time, c.contest_evaluation,
                    c.ai_assistance, c.authored_by, u.name AS authored_by_name
             FROM contests c
             JOIN users u ON c.authored_by = u.id
             WHERE c.authored_by = ?
             ORDER BY c.created_on DESC`,
            [userId]
        );
        return rows;
    }

    static async update(
        id,
        {
            description,
            division,
            contest_start_time,
            contest_end_time,
            ai_assistance,
        }
    ) {
        const [result] = await pool.query(
            `UPDATE contests
             SET description = ?, division = ?, contest_start_time = ?, contest_end_time = ?, ai_assistance = ?
             WHERE id = ?`,
            [
                description ?? null,
                division,
                contest_start_time,
                contest_end_time,
                ai_assistance ?? false,
                id,
            ]
        );
        return result;
    }

    static async setVerified(id, isVerified) {
        const [result] = await pool.query(
            'UPDATE contests SET isVerified = ? WHERE id = ?',
            [isVerified, id]
        );
        return result;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM contests WHERE id = ?', [
            id,
        ]);
        return result;
    }

    static async getPendingEvaluations() {
        const [rows] = await pool.query(
            `SELECT * FROM contests 
             WHERE contest_end_time < NOW() 
             AND contest_evaluation = 'pending'`
        );
        return rows;
    }

    static async updateEvaluationStatus(id, status) {
        const [result] = await pool.query(
            'UPDATE contests SET contest_evaluation = ? WHERE id = ?',
            [status, id]
        );
        return result;
    }

    static async getUpcomingPublic() {
        const [rows] = await pool.query(
            `SELECT c.id, c.title, c.division, c.contest_start_time, c.contest_end_time,
                    u.name AS authored_by_name,
                    COUNT(DISTINCT cr.user_id) AS registered_count
             FROM contests c
             JOIN users u ON c.authored_by = u.id
             LEFT JOIN contest_registrations cr ON cr.contest_id = c.id
             WHERE c.isVerified = 1
               AND c.contest_start_time > NOW()
               AND c.contest_start_time <= DATE_ADD(NOW(), INTERVAL 7 DAY)
             GROUP BY c.id
             ORDER BY c.contest_start_time ASC
             LIMIT 10`
        );
        return rows;
    }
}

export default Contest;
