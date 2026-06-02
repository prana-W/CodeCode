import pool from '../db/db.js';

class Problem {
    static async create({ contest_id, title, score, rating, statement, input, output, explanation }) {
        const [result] = await pool.query(
            `INSERT INTO problems (contest_id, title, score, rating, statement, input, output, explanation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [contest_id, title, score, rating, statement, input, output, explanation ?? null]
        );
        return result.insertId;
    }

    static async findById(problem_id) {
        const [rows] = await pool.query(
            'SELECT * FROM problems WHERE problem_id = ?',
            [problem_id]
        );
        return rows[0];
    }

    // Update editable fields (contest author-only)
    static async update(problem_id, { title, score, rating, input, output, statement, explanation }) {
        const [result] = await pool.query(
            `UPDATE problems
             SET title = ?, score = ?, rating = ?, input = ?, output = ?, statement = ?, explanation = ?
             WHERE problem_id = ?`,
            [title, score, rating, input, output, statement, explanation ?? null, problem_id]
        );
        return result;
    }

    static async delete(problem_id) {
        const [result] = await pool.query(
            'DELETE FROM problems WHERE problem_id = ?',
            [problem_id]
        );
        return result;
    }
}

export default Problem;
