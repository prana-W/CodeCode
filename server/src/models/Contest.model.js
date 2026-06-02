import pool from '../db/db.js';

class Contest {
    static async create({ title, description, authored_by, contest_start_time, contest_end_time, division }) {
        const [result] = await pool.query(
            `INSERT INTO contests (title, description, authored_by, contest_start_time, contest_end_time, division)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description ?? null, authored_by, contest_start_time, contest_end_time, division]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM contests WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, { description, division, contest_start_time, contest_end_time }) {
        const [result] = await pool.query(
            `UPDATE contests
             SET description = ?, division = ?, contest_start_time = ?, contest_end_time = ?
             WHERE id = ?`,
            [description ?? null, division, contest_start_time, contest_end_time, id]
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
        const [result] = await pool.query(
            'DELETE FROM contests WHERE id = ?',
            [id]
        );
        return result;
    }
}

export default Contest;
