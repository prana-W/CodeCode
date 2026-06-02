import pool from '../db/db.js';

const VALID_LANGUAGES = ['cpp', 'c', 'java', 'python', 'javascript'];

class Submission {
    static get validLanguages() {
        return VALID_LANGUAGES;
    }

    static async create({problem_id, submitted_by, language, source_code}) {
        const [result] = await pool.query(
            `INSERT INTO submissions (problem_id, submitted_by, language, source_code)
             VALUES (?, ?, ?, ?)`,
            [problem_id, submitted_by, language, source_code]
        );
        return result.insertId;
    }

    static async findById(submission_id) {
        const [rows] = await pool.query(
            'SELECT * FROM submissions WHERE submission_id = ?',
            [submission_id]
        );
        return rows[0];
    }

    static async findWithContest(problem_id) {
        const [rows] = await pool.query(
            `SELECT c.authored_by AS contest_authored_by, c.contest_start_time
             FROM problems p
             JOIN contests c ON p.contest_id = c.id
             WHERE p.problem_id = ?`,
            [problem_id]
        );
        return rows[0];
    }
    static async findAllByContest(contest_id, submitted_by = null) {
        const params = [contest_id];
        let userFilter = '';
        if (submitted_by !== null) {
            userFilter = 'AND s.submitted_by = ?';
            params.push(submitted_by);
        }
        const [rows] = await pool.query(
            `SELECT s.submission_id, s.problem_id, s.submitted_by, s.submitted_at,
                    s.verdict, s.language, s.execution_time_ms, s.memory_used_kb,
                    c.authored_by AS contest_authored_by
             FROM submissions s
             JOIN problems p ON s.problem_id = p.problem_id
             JOIN contests c ON p.contest_id = c.id
             WHERE c.id = ? ${userFilter}
             ORDER BY s.submitted_at DESC`,
            params
        );
        return rows;
    }

    static async findByIdWithContest(submission_id) {
        const [rows] = await pool.query(
            `SELECT s.*, c.authored_by AS contest_authored_by
             FROM submissions s
             JOIN problems p ON s.problem_id = p.problem_id
             JOIN contests c ON p.contest_id = c.id
             WHERE s.submission_id = ?`,
            [submission_id]
        );
        return rows[0];
    }

    static async findForJudge(submission_id) {
        const [rows] = await pool.query(
            `SELECT s.submission_id, s.source_code, s.language,
                    p.time_limit_ms, p.memory_limit_mb,
                    tc.input_data, tc.expected_output
             FROM submissions s
             JOIN problems p ON s.problem_id = p.problem_id
             LEFT JOIN test_cases tc ON tc.problem_id = p.problem_id
             WHERE s.submission_id = ?`,
            [submission_id]
        );
        return rows[0];
    }

    static async setVerdict(submission_id, verdict, execution_time_ms = null, memory_used_kb = null) {
        await pool.query(
            `UPDATE submissions
             SET verdict = ?, execution_time_ms = ?, memory_used_kb = ?
             WHERE submission_id = ?`,
            [verdict, execution_time_ms, memory_used_kb, submission_id]
        );
    }
}

export default Submission;
