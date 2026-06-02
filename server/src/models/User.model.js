import pool from '../db/db.js';

class User {
    static async create({
        username,
        name,
        institute,
        email,
        password,
        rating,
        max_rating,
        role,
    }) {
        const [result] = await pool.query(
            `
            INSERT INTO users (
                username,
                name,
                institute,
                email,
                password,
                rating,
                max_rating,
                role
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                username,
                name,
                institute,
                email,
                password,
                rating,
                max_rating,
                role,
            ]
        );

        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
            id,
        ]);

        return rows[0];
    }

    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [
            email,
        ]);

        return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        return rows[0];
    }

    static async getAll() {
        const [rows] = await pool.query('SELECT * FROM users');

        return rows;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [
            id,
        ]);

        return result;
    }
}

export default User;
