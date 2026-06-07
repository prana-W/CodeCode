import {Queue} from 'bullmq';
import connection from '../config/redis.js';

const customInvocationQueue = new Queue('custom-invocation-queue', {connection});

export default customInvocationQueue;
