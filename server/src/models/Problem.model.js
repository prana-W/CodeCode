import pool from '../db/db.js';

class Problem {
    static async create({ contest_id, title, score, rating, statement, explanation }) {
        const [result] = await pool.query(
            `INSERT INTO problems (contest_id, title, score, rating, statement, explanation)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [contest_id, title, score, rating, statement, explanation ?? null]
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

    // Returns problem columns + c.authored_by in a single JOIN
    static async findWithContest(problem_id) {
        const [rows] = await pool.query(
            `SELECT p.*, c.authored_by AS contest_authored_by
             FROM problems p
             JOIN contests c ON p.contest_id = c.id
             WHERE p.problem_id = ?`,
            [problem_id]
        );
        return rows[0];
    }

    static async update(problem_id, { title, score, rating, statement, explanation }) {
        const [result] = await pool.query(
            `UPDATE problems
             SET title = ?, score = ?, rating = ?, statement = ?, explanation = ?
             WHERE problem_id = ?`,
            [title, score, rating, statement, explanation ?? null, problem_id]
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
