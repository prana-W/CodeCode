import {Server} from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance;
const activeUsers = new Set();

export const getIO = () => ioInstance;

function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Socket Authentication Middleware
    io.use((socket, next) => {
        try {
            // Read the accessToken from the httpOnly cookie sent in the handshake
            let token = null;

            if (socket.handshake.headers.cookie) {
                const cookies = socket.handshake.headers.cookie.split(';');
                const tokenCookie = cookies.find((c) =>
                    c.trim().startsWith('accessToken=')
                );
                if (tokenCookie) {
                    token = tokenCookie.split('=')[1];
                }
            }

            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            const verifiedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.user = verifiedToken; // Attach user info to socket
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        // Automatically join a room for this specific user
        if (socket.user && socket.user.userId) {
            const userId = socket.user.userId.toString();
            socket.join(userId);

            // Add to active users and broadcast
            if (!activeUsers.has(userId)) {
                activeUsers.add(userId);
                io.emit('live_users_update', activeUsers.size);
            }

            // Send initial count to this newly connected tab
            socket.emit('live_users_update', activeUsers.size);
        }

        socket.on('disconnect', async () => {
            if (socket.user && socket.user.userId) {
                const userId = socket.user.userId.toString();

                // Check if user has any other active sockets (tabs)
                const sockets = await io.in(userId).fetchSockets();
                if (sockets.length === 0) {
                    activeUsers.delete(userId);
                    io.emit('live_users_update', activeUsers.size);
                }
            }
        });
    });

    ioInstance = io;
    return io;
}

export default initializeSocket;
