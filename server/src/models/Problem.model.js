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

    static async findAllByContest(contest_id) {
        const [rows] = await pool.query(
            `SELECT p.problem_id, p.title, c.authored_by AS contest_authored_by,
                    c.contest_start_time, c.contest_end_time
             FROM problems p
             JOIN contests c ON p.contest_id = c.id
             WHERE p.contest_id = ?`,
            [contest_id]
        );
        return rows;
    }

    static async findByIdWithSampleTestCases(problem_id) {
        const [rows] = await pool.query(
            `SELECT p.problem_id, p.contest_id, p.title, p.score, p.rating,
                    p.statement, p.explanation,
                    c.authored_by AS contest_authored_by,
                    c.contest_start_time, c.contest_end_time,
                    tc.test_case_id, tc.input_data, tc.expected_output, tc.is_sample
             FROM problems p
             JOIN contests c ON p.contest_id = c.id
             LEFT JOIN test_cases tc ON tc.problem_id = p.problem_id AND tc.is_sample = true
             WHERE p.problem_id = ?`,
            [problem_id]
        );
        return rows;
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
