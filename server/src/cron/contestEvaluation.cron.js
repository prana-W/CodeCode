import cron from 'node-cron';
import Contest from '../models/Contest.model.js';
import {deltaCalculation} from '../services/contest.service.js';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
        const pendingContests = await Contest.getPendingEvaluations();

        if (pendingContests.length === 0) {
            return;
        }

        for (const contest of pendingContests) {
            await Contest.updateEvaluationStatus(contest.id, 'running');

            try {
                await deltaCalculation(contest.id);

                await Contest.updateEvaluationStatus(contest.id, 'completed');
                console.log(
                    `[CRON] Successfully evaluated contest ${contest.id}.`
                );
            } catch (error) {
                console.error(
                    `[CRON] Failed to evaluate contest ${contest.id}:`,
                    error
                );
                // Revert to pending if it failed so it can be retried
                await Contest.updateEvaluationStatus(contest.id, 'pending');
            }
        }
    } catch (error) {
        console.error('[CRON] Error during contest evaluation job:', error);
    }
});
