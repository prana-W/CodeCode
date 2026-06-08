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
            connection.publish('socket_updates', JSON.stringify({
                userId: data.submitted_by,
                event: 'submission_update',
                payload: { submission_id: submissionId, verdict: 'runtime_error' }
            }));
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
            connection.publish('socket_updates', JSON.stringify({
                userId: data.submitted_by,
                event: 'submission_update',
                payload: { submission_id: submissionId, verdict, execution_time_ms, memory_used_kb }
            }));
        } catch (err) {
            console.error(
                `Judge failed for submission ${submissionId}:`,
                err.message
            );
            await Submission.setVerdict(submissionId, 'runtime_error');
            connection.publish('socket_updates', JSON.stringify({
                userId: data.submitted_by,
                event: 'submission_update',
                payload: { submission_id: submissionId, verdict: 'runtime_error' }
            }));
        }
    },
    {connection, concurrency: 2}
);
