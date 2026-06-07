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

    static async getRankings(institute, sortBy = 'rating') {
        let query = `
            SELECT id, name, username, email, institute, rating, max_rating, role 
            FROM users 
            WHERE role != 'admin'
        `;
        const params = [];

        if (institute && institute !== 'All Institutes') {
            query += ' AND institute = ? ';
            params.push(institute);
        }

        const validSortFields = ['rating', 'max_rating'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'rating';

        query += ` ORDER BY ${sortField} DESC, id ASC`;

        const [rows] = await pool.query(query, params);
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

    static async updateRating(conn, id, newRating, newMaxRating) {
        await conn.query(
            `UPDATE users SET rating = ?, max_rating = ? WHERE id = ?`,
            [newRating, newMaxRating, id]
        );
    }
}

export default User;
