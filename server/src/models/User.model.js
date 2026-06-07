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

    /**
     * Returns all activity data needed for the profile heatmap section:
     *  - heatmap: per-day totals (for the requested year)
     *  - allTimeTotal / allTimeAccepted
     *  - yearTotal / yearAccepted
     *  - currentStreak / longestStreak (computed in JS from daily accepted)
     */
    static async getActivityStats(userId, year) {
        // 1. Per-day counts for the requested year
        const [heatmapRows] = await pool.query(
            `SELECT
                DATE(submitted_at)                          AS day,
                COUNT(*)                                    AS total,
                SUM(verdict = 'accepted')                   AS accepted
             FROM submissions
             WHERE submitted_by = ?
               AND YEAR(submitted_at) = ?
             GROUP BY DATE(submitted_at)
             ORDER BY day ASC`,
            [userId, year]
        );

        // 2. All-time totals
        const [[allTime]] = await pool.query(
            `SELECT
                COUNT(*)                  AS total,
                SUM(verdict = 'accepted') AS accepted
             FROM submissions
             WHERE submitted_by = ?`,
            [userId]
        );

        // 3. Year totals (reuse heatmap rows for efficiency)
        const yearTotal    = heatmapRows.reduce((s, r) => s + Number(r.total),    0);
        const yearAccepted = heatmapRows.reduce((s, r) => s + Number(r.accepted), 0);

        // 4. Streak calculation — based on days with at least 1 accepted submission
        //    We need accepted-day history across ALL years for streak, not just current year
        const [[{ allDaysAccepted }]] = await pool.query(
            `SELECT GROUP_CONCAT(DISTINCT DATE(submitted_at) ORDER BY DATE(submitted_at) ASC) AS allDaysAccepted
             FROM submissions
             WHERE submitted_by = ? AND verdict = 'accepted'`,
            [userId]
        );

        let currentStreak = 0;
        let longestStreak = 0;

        if (allDaysAccepted) {
            const days = allDaysAccepted.split(','); // already sorted ASC
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Work backwards from today for current streak
            let streak = 0;
            for (let i = days.length - 1; i >= 0; i--) {
                const d = new Date(days[i]);
                const expected = new Date(today);
                expected.setDate(expected.getDate() - streak);
                if (d.toISOString().slice(0, 10) === expected.toISOString().slice(0, 10)) {
                    streak++;
                } else {
                    break;
                }
            }
            // Also check if streak should include yesterday (user hasn't submitted today yet)
            if (streak === 0 && days.length > 0) {
                let streakFromYesterday = 0;
                for (let i = days.length - 1; i >= 0; i--) {
                    const d = new Date(days[i]);
                    const expected = new Date(yesterday);
                    expected.setDate(expected.getDate() - streakFromYesterday);
                    if (d.toISOString().slice(0, 10) === expected.toISOString().slice(0, 10)) {
                        streakFromYesterday++;
                    } else {
                        break;
                    }
                }
                streak = streakFromYesterday;
            }
            currentStreak = streak;

            // Longest streak — forward pass
            let longest = 0;
            let cur = 1;
            for (let i = 1; i < days.length; i++) {
                const prev = new Date(days[i - 1]);
                const curr = new Date(days[i]);
                const diffMs = curr - prev;
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                if (diffDays === 1) {
                    cur++;
                } else {
                    if (cur > longest) longest = cur;
                    cur = 1;
                }
            }
            if (cur > longest) longest = cur;
            longestStreak = days.length > 0 ? longest : 0;
        }

        return {
            heatmap: heatmapRows.map((r) => ({
                day: r.day instanceof Date
                    ? r.day.toISOString().slice(0, 10)
                    : String(r.day),
                total:    Number(r.total),
                accepted: Number(r.accepted),
            })),
            allTimeTotal:    Number(allTime.total    ?? 0),
            allTimeAccepted: Number(allTime.accepted ?? 0),
            yearTotal,
            yearAccepted,
            currentStreak,
            longestStreak,
            year,
        };
    }
}

export default User;
