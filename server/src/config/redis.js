import {Redis} from 'ioredis';

const connection = new Redis({
    host: 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
});

export default connection;
