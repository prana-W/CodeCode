import {Worker} from 'bullmq';
import connection from '../config/redis.js';
import {runCustomInvocationJudge} from '../services/judge.service.js';

const worker = new Worker(
    'custom-invocation-queue',
    async (job) => {
        const {customInvocationId, source_code, language, input_data} = job.data;

        console.log(`[Worker] Started custom invocation ${customInvocationId}`);

        try {
            const result = await runCustomInvocationJudge({
                customInvocationId,
                source_code,
                language,
                input_data,
            });

            console.log(`[Worker] Custom invocation ${customInvocationId} completed. Verdict: ${result.verdict}`);

            const val = {
                status: 'completed',
                customInvocationId,
                output: result.actual_output,
                verdict: result.verdict,
                compilationError: result.compilation_error,
                executionTimeMs: result.execution_time_ms,
            };

            // Add the output/error in redis with a TTL of 2 minutes (120 seconds)
            await connection.set(`custom_invocation:${customInvocationId}`, JSON.stringify(val), 'EX', 120);

        } catch (err) {
            console.error(`[Worker] Custom invocation ${customInvocationId} failed:`, err.message);

            const val = {
                status: 'completed',
                customInvocationId,
                output: '',
                verdict: 'runtime_error',
                compilationError: '',
                error: err.message || 'Execution error',
                executionTimeMs: 0,
            };

            await connection.set(`custom_invocation:${customInvocationId}`, JSON.stringify(val), 'EX', 120);
        }
    },
    {connection, concurrency: 2}
);

console.log('🚀 Custom Invocation Worker is running');
