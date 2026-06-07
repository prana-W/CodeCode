import pool from '../db/db.js';
import ContestRegistration from '../models/ContestRegistration.model.js';
import User from '../models/User.model.js';

const K = 4;
const RATING_FLOOR = 400;

// Calculated elo-like rating delta for all participant, done using single DB transaction
export const deltaCalculation = async (contestId) => {
    console.log(`[DeltaCalculation] Starting for contest ${contestId}`);

    const participants =
        await ContestRegistration.getParticipantsWithRating(contestId);
    const n = participants.length;

    if (n === 0) {
        console.log(
            `[DeltaCalculation] No participants for contest ${contestId}. Skipping.`
        );
        return;
    }

    const ranked = participants.map((p, idx) => ({
        userId: p.user_id,
        currentRating: p.currentRating,
        actualRank: idx + 1,
        finalScore: p.final_score,
    }));

    for (let i = 0; i < n; i++) {
        let expectedWins = 0;

        for (let j = 0; j < n; j++) {
            if (i === j) continue;

            const ratingDiff =
                ranked[j].currentRating - ranked[i].currentRating;
            const probability = 1 / (1 + Math.pow(10, ratingDiff / 400));
            expectedWins += probability;
        }

        ranked[i].expectedWins = expectedWins;
        ranked[i].expectedRank = n - expectedWins;
    }

    for (const p of ranked) {
        const rankDifference = p.expectedRank - p.actualRank;
        p.delta = Math.round(K * rankDifference);
    }

    const sumDelta = ranked.reduce((acc, p) => acc + p.delta, 0);
    const correction = Math.round(sumDelta / n);

    for (const p of ranked) {
        p.delta -= correction;
    }

    for (const p of ranked) {
        p.newRating = Math.max(p.currentRating + p.delta, RATING_FLOOR);
        p.delta = p.newRating - p.currentRating;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        for (const p of ranked) {
            await ContestRegistration.updateDelta(
                conn,
                contestId,
                p.userId,
                p.delta,
                p.newRating
            );

            const [userRows] = await conn.query(
                'SELECT max_rating FROM users WHERE id = ?',
                [p.userId]
            );
            const currentMaxRating = userRows[0]?.max_rating ?? 0;
            const newMaxRating = Math.max(currentMaxRating, p.newRating);

            await User.updateRating(conn, p.userId, p.newRating, newMaxRating);
        }

        await conn.commit();

        ranked.forEach((p) =>
            console.log(
                `  userId=${p.userId} | rank=${p.actualRank}/${n} | ` +
                    `rating ${p.currentRating} → ${p.newRating} (Δ${p.delta >= 0 ? '+' : ''}${p.delta})`
            )
        );
    } catch (err) {
        await conn.rollback();
        console.error(
            `[DeltaCalculation] Transaction rolled back for contest ${contestId}:`,
            err
        );

        throw err;
    } finally {
        conn.release();
    }
};
