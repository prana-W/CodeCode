import dotenv from 'dotenv';
import {createServer} from 'http';
import connectToDatabase from './db/connectDB.js';
import app from './app.js';
import './cron/contestEvaluation.cron.js';
import initializeSocket from './sockets/index.js';
import redis from './config/redis.js';

dotenv.config({
    path: `./.env`,
});

const port = process.env.PORT || 8000;
const httpServer = createServer(app); // Create HTTP server
const io = initializeSocket(httpServer);

// Redis Pub/Sub for worker communication
const redisSubscriber = redis.duplicate();
redisSubscriber.subscribe('socket_updates');
redisSubscriber.on('message', (channel, message) => {
    if (channel === 'socket_updates') {
        try {
            const data = JSON.parse(message);
            if (data.userId) {
                // Emit only to the specific user's room
                io.to(data.userId.toString()).emit(data.event, data.payload);
            } else {
                io.emit(data.event, data.payload);
            }
        } catch (error) {
            console.error('Error parsing socket_updates message:', error);
        }
    }
});

connectToDatabase().then(() => {
    httpServer.listen(port, () => {
        console.log(`✅ Server is running on port ${port}`);
    });
});

// connectToNgrok(port).then((listener) => {
//     console.log('Public Server URL:', listener.url());
// });
