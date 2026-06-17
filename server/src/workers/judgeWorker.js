import {Worker} from 'bullmq';
import connection from '../config/redis.js';
import Submission from '../models/Submission.model.js';
import {runJudge} from '../services/judge.service.js';

const worker = new Worker(
    'submission-queue',
    async (job) => {
        const {submissionId} = job.data;

        const data = await Submission.findForJudge(submissionId);
        if (!data) {
            console.error(`Submission ${submissionId} not found.`);
            return;
        }

        if (!data.input_data) {
            await Submission.setVerdict(submissionId, 'runtime_error');
            console.error(`No test case found for submission ${submissionId}.`);
            await connection.publish(
                'socket_updates',
                JSON.stringify({
                    userId: data.submitted_by,
                    event: 'submission_update',
                    payload: {
                        submission_id: submissionId,
                        verdict: 'runtime_error',
                    },
                })
            );
            return;
        }

        await Submission.setVerdict(submissionId, 'running');

        try {
            const {verdict, execution_time_ms, memory_used_kb} =
                await runJudge(data);
            await Submission.setVerdict(
                submissionId,
                verdict,
                execution_time_ms,
                memory_used_kb
            );

            if (
                verdict === 'accepted' &&
                new Date() <= new Date(data.contest_end_time)
            ) {
                await Submission.recordStanding({
                    contest_id: data.contest_id,
                    user_id: data.submitted_by,
                    problem_id: data.problem_id,
                    accepted_submission_id: submissionId,
                });
            }

            console.log(
                `Submission ${submissionId}: ${verdict} (${execution_time_ms}ms, ${memory_used_kb}KB)`
            );

            // Publish to sockets
            await connection.publish(
                'socket_updates',
                JSON.stringify({
                    userId: data.submitted_by,
                    event: 'submission_update',
                    payload: {
                        submission_id: submissionId,
                        verdict,
                        execution_time_ms,
                        memory_used_kb,
                    },
                })
            );
        } catch (err) {
            const maxAttempts = job.opts.attempts || 1;
            console.error(
                `Judge failed for submission ${submissionId} (Attempt ${job.attemptsMade + 1}/${maxAttempts}):`,
                err.message
            );
            
            // If this is the last attempt, mark it as system_error
            if (job.attemptsMade >= maxAttempts - 1) {
                await Submission.setVerdict(submissionId, 'system_error');
                await connection.publish(
                    'socket_updates',
                    JSON.stringify({
                        userId: data.submitted_by,
                        event: 'submission_update',
                        payload: {
                            submission_id: submissionId,
                            verdict: 'system_error',
                        },
                    })
                );
            }
            throw err;
        }
    },
    {connection, concurrency: 4, removeOnComplete: {count: 5}, removeOnFail: {count: 5}}
);

worker.on('completed', job => {
    console.log(`✅ [JudgeWorker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`❌ [JudgeWorker] Job ${job?.id} failed with error: ${err.message}`);
});

console.log('🚀 Judge Worker is running and listening to submission-queue...');
