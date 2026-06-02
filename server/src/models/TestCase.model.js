import pool from '../db/db.js';

class TestCase {
    static async create({ problem_id, input_data, expected_output, is_sample }) {
        const [result] = await pool.query(
            `INSERT INTO test_cases (problem_id, input_data, expected_output, is_sample)
             VALUES (?, ?, ?, ?)`,
            [problem_id, input_data, expected_output, is_sample ?? false]
        );
        return result.insertId;
    }

    static async findById(test_case_id) {
        const [rows] = await pool.query(
            'SELECT * FROM test_cases WHERE test_case_id = ?',
            [test_case_id]
        );
        return rows[0];
    }

    static async findByProblemId(problem_id) {
        const [rows] = await pool.query(
            'SELECT * FROM test_cases WHERE problem_id = ?',
            [problem_id]
        );
        return rows[0];
    }

    static async update(test_case_id, { input_data, expected_output, is_sample }) {
        const [result] = await pool.query(
            `UPDATE test_cases
             SET input_data = ?, expected_output = ?, is_sample = ?
             WHERE test_case_id = ?`,
            [input_data, expected_output, is_sample, test_case_id]
        );
        return result;
    }

    static async delete(test_case_id) {
        const [result] = await pool.query(
            'DELETE FROM test_cases WHERE test_case_id = ?',
            [test_case_id]
        );
        return result;
    }
}

export default TestCase;
