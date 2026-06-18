import dotenv from 'dotenv';
import {createServer} from 'http';
import connectToDatabase from './db/connectDB.js';
import app from './app.js';
import './cron/contestEvaluation.cron.js';
import initializeSocket from './sockets/index.js';
import redis from './config/redis.js';
import Submission from './models/Submission.model.js';

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

connectToDatabase().then(async () => {
    // Recover any submissions that got stuck in pending/running while workers were down.
    // Mark them as system_error so users aren't left with an infinite spinner.
    try {
        const cleaned = await Submission.clearStuckSubmissions(5);
        if (cleaned > 0) {
            console.log(
                `⚠️  Recovered ${cleaned} stuck submission(s) → system_error`
            );
        }
    } catch (err) {
        console.error('Failed to clear stuck submissions on startup:', err.message);
    }

    httpServer.listen(port, () => {
        console.log(`✅ Server is running on port ${port}`);
    });
});

// connectToNgrok(port).then((listener) => {
//     console.log('Public Server URL:', listener.url());
// });
