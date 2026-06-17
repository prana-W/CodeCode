import {Queue} from 'bullmq';
import connection from '../config/redis.js';

const emailQueue = new Queue('email-queue', {
    connection,
    defaultJobOptions: {
        attempts: 2, // initial + 1 retry
        backoff: {type: 'exponential', delay: 5000},
    },
});

export default emailQueue;
