import dotenv from 'dotenv';
import {createServer} from 'http';
// import {connectToNgrok} from './connection/index.js';
import connectToDatabase from './db/connectDB.js';
import app from './app.js';

dotenv.config({
    path: `./.env`,
});

const port = process.env.PORT || 8000;
const httpServer = createServer(app); // Create HTTP server

connectToDatabase().then(() => {
    httpServer.listen(port, () => {
        console.log(`✅ Server is running on port ${port}`);
    });
});

// connectToNgrok(port).then((listener) => {
//     console.log('Public Server URL:', listener.url());
// });
