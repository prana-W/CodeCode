import pool from '../db/db.js';

class Problem {
    static async create({
        contest_id,
        title,
        score,
        rating,
        statement,
        explanation,
        time_limit_ms,
        memory_limit_mb,
    }) {
        const [result] = await pool.query(
            `INSERT INTO problems (contest_id, title, score, rating, statement, explanation, time_limit_ms, memory_limit_mb)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                contest_id,
                title,
                score,
                rating,
                statement,
                explanation ?? null,
                time_limit_ms,
                memory_limit_mb,
            ]
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
            `SELECT p.problem_id, p.title, p.time_limit_ms, p.memory_limit_mb, p.score,
                    p.rating, p.statement, p.explanation,
                    c.authored_by AS contest_authored_by,
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
                    p.statement, p.explanation, p.time_limit_ms, p.memory_limit_mb,
                    c.authored_by AS contest_authored_by,
                    c.contest_start_time, c.contest_end_time,
                    tc.test_case_id, tc.sample_input_data, tc.sample_expected_output
             FROM problems p
             JOIN contests c ON p.contest_id = c.id
             LEFT JOIN test_cases tc ON tc.problem_id = p.problem_id
             WHERE p.problem_id = ?`,
            [problem_id]
        );
        return rows;
    }

    static async update(
        problem_id,
        {
            title,
            score,
            rating,
            statement,
            explanation,
            time_limit_ms,
            memory_limit_mb,
        }
    ) {
        const [result] = await pool.query(
            `UPDATE problems
             SET title = ?, score = ?, rating = ?, statement = ?, explanation = ?,
                 time_limit_ms = ?, memory_limit_mb = ?
             WHERE problem_id = ?`,
            [
                title,
                score,
                rating,
                statement,
                explanation ?? null,
                time_limit_ms,
                memory_limit_mb,
                problem_id,
            ]
        );
        return result;
    }

    /**
     * Fetches all problems from verified, ended contests.
     * Includes per-user status: 'accepted', 'attempted', or null.
     * Supports server-side pagination.
     */
    static async findProblemSet(userId, page = 1, limit = 50) {
        const offset = (page - 1) * limit;

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM problems p
             JOIN contests c ON p.contest_id = c.id
             WHERE c.isVerified = 1
               AND c.contest_end_time < NOW()`
        );

        const [rows] = await pool.query(
            `SELECT
                p.problem_id,
                p.contest_id,
                p.title,
                p.score,
                c.title AS contest_title,
                c.division,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM submissions s2
                        WHERE s2.problem_id = p.problem_id
                          AND s2.submitted_by = ?
                          AND s2.verdict = 'accepted'
                    ) THEN 'accepted'
                    WHEN EXISTS (
                        SELECT 1 FROM submissions s3
                        WHERE s3.problem_id = p.problem_id
                          AND s3.submitted_by = ?
                    ) THEN 'attempted'
                    ELSE NULL
                END AS user_status
             FROM problems p
             JOIN contests c ON p.contest_id = c.id
             WHERE c.isVerified = 1
               AND c.contest_end_time < NOW()
             ORDER BY p.score DESC, p.problem_id ASC
             LIMIT ? OFFSET ?`,
            [userId, userId, limit, offset]
        );

        return { rows, total: Number(total) };
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
