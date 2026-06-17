import {Worker} from 'bullmq';
import connection from '../config/redis.js';
import {runCustomInvocationJudge} from '../services/judge.service.js';

const worker = new Worker(
    'custom-invocation-queue',
    async (job) => {
        const {
            customInvocationId,
            source_code,
            language,
            input_data,
            time_limit_ms,
            memory_limit_mb,
            userId,
        } = job.data;

        console.log(`[Worker] Started custom invocation ${customInvocationId}`);

        try {
            const result = await runCustomInvocationJudge({
                customInvocationId,
                source_code,
                language,
                input_data,
                time_limit_ms,
                memory_limit_mb,
            });

            console.log(
                `[Worker] Custom invocation ${customInvocationId} completed. Verdict: ${result.verdict}`
            );

            const val = {
                status: 'completed',
                customInvocationId,
                output: result.actual_output,
                verdict: result.verdict,
                compilationError: result.compilation_error,
                executionTimeMs: result.execution_time_ms,
                memoryUsedKb: result.memory_used_kb,
            };

            // Add the output/error in redis with a TTL of 2 minutes (120 seconds)
            await connection.set(
                `custom_invocation:${customInvocationId}`,
                JSON.stringify(val),
                'EX',
                120
            );

            // Publish to sockets
            if (userId) {
                await connection.publish(
                    'socket_updates',
                    JSON.stringify({
                        userId,
                        event: 'custom_invocation_update',
                        payload: val,
                    })
                );
            }
        } catch (err) {
            const maxAttempts = job.opts.attempts || 1;
            console.error(
                `[Worker] Custom invocation ${customInvocationId} failed (Attempt ${job.attemptsMade + 1}/${maxAttempts}):`,
                err.message
            );

            // If this is the last attempt, mark it as system_error
            if (job.attemptsMade >= maxAttempts - 1) {
                const val = {
                    status: 'completed',
                    customInvocationId,
                    output: '',
                    verdict: 'system_error',
                    compilationError: '',
                    error: err.message || 'Execution error',
                    executionTimeMs: 0,
                    memoryUsedKb: 0,
                };

                await connection.set(
                    `custom_invocation:${customInvocationId}`,
                    JSON.stringify(val),
                    'EX',
                    120
                );

                // Publish to sockets
                if (userId) {
                    await connection.publish(
                        'socket_updates',
                        JSON.stringify({
                            userId,
                            event: 'custom_invocation_update',
                            payload: val,
                        })
                    );
                }
            }
            throw err;
        }
    },
    {
        connection,
        concurrency: 4,
        removeOnComplete: {count: 5},
        removeOnFail: {count: 5},
    }
);

worker.on('completed', (job) => {
    console.log(
        `✅ [CustomInvocationWorker] Job ${job.id} completed successfully`
    );
});

worker.on('failed', (job, err) => {
    console.error(
        `❌ [CustomInvocationWorker] Job ${job?.id} failed with error: ${err.message}`
    );
});

console.log(
    '🚀 Custom Invocation Worker is running and listening to custom-invocation-queue...'
);
