import crypto from 'crypto';
import redis from '../config/redis.js';
import customInvocationQueue from '../queues/customInvocationQueue.js';

export async function runCustomInvocation(req, res, next) {
    try {
        const {source_code, language, input_data} = req.body;
        if (!source_code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Source code and language are required.',
            });
        }

        const customInvocationId = crypto.randomUUID();
        const key = `custom_invocation:${customInvocationId}`;

        // Set pending status in Redis with a 2-minute TTL
        const pendingVal = {
            status: 'pending',
            userId: req.userId,
            customInvocationId,
        };
        await redis.set(key, JSON.stringify(pendingVal), 'EX', 120);

        // Add task to custom-invocation-queue with high priority (priority: 1)
        await customInvocationQueue.add(
            'run',
            {
                customInvocationId,
                userId: req.userId,
                source_code,
                language,
                input_data,
            },
            {priority: 1}
        );

        return res.status(200).json({
            success: true,
            customInvocationId,
        });
    } catch (err) {
        return next(err);
    }
}

export async function getCustomInvocationStatus(req, res, next) {
    try {
        const {customInvocationId} = req.params;
        const key = `custom_invocation:${customInvocationId}`;

        const value = await redis.get(key);
        if (!value) {
            return res.status(404).json({
                success: false,
                message: 'Custom invocation not found or expired.',
            });
        }

        const parsed = JSON.parse(value);

        // Check if status is pending
        if (parsed.status === 'pending') {
            return res.status(200).json({
                success: true,
                status: 'pending',
            });
        }

        // Output/error is ready, delete the Redis entry immediately
        await redis.del(key);

        return res.status(200).json({
            success: true,
            status: 'completed',
            data: parsed,
        });
    } catch (err) {
        return next(err);
    }
}
