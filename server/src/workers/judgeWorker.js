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
            return;
        }

        await Submission.setVerdict(submissionId, 'running');

        try {
            const {verdict, execution_time_ms} = await runJudge(data);
            await Submission.setVerdict(
                submissionId,
                verdict,
                execution_time_ms
            );
            console.log(
                `Submission ${submissionId}: ${verdict} (${execution_time_ms}ms)`
            );
        } catch (err) {
            console.error(
                `Judge failed for submission ${submissionId}:`,
                err.message
            );
            await Submission.setVerdict(submissionId, 'runtime_error');
        }
    },
    {connection, concurrency: 2}
);
