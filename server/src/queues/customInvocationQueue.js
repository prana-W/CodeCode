import {Queue} from 'bullmq';
import connection from '../config/redis.js';

const customInvocationQueue = new Queue('custom-invocation-queue', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {type: 'exponential', delay: 2000},
    },
});


export default customInvocationQueue;
