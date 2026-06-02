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

    static async update(id, {name, institute, email}) {
        const [result] = await pool.query(
            `
            UPDATE users
            SET name = ?, institute = ?, email = ?
            WHERE id = ?
            `,
            [name, institute, email, id]
        );

        return result;
    }

    /**
     * Updates a user's rating and max_rating inside an existing DB transaction.
     * @param {import('mysql2/promise').PoolConnection} conn - Active transaction connection
     * @param {number} id - User ID
     * @param {number} newRating - New computed rating (already floored)
     * @param {number} newMaxRating - New max_rating (Math.max of old and newRating)
     */
    static async updateRating(conn, id, newRating, newMaxRating) {
        await conn.query(
            `UPDATE users SET rating = ?, max_rating = ? WHERE id = ?`,
            [newRating, newMaxRating, id]
        );
    }
}

export default User;
