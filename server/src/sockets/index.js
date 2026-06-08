import {Server} from 'socket.io';
import jwt from 'jsonwebtoken';

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
            // Get token from auth payload or cookie string
            let token = socket.handshake.auth?.token;
            
            if (!token && socket.handshake.headers.cookie) {
                const cookies = socket.handshake.headers.cookie.split(';');
                const tokenCookie = cookies.find((c) => c.trim().startsWith('token='));
                if (tokenCookie) {
                    token = tokenCookie.split('=')[1];
                }
            }

            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = verifiedToken; // Attach user info to socket
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        // Automatically join a room for this specific user
        if (socket.user && socket.user.userId) {
            socket.join(socket.user.userId.toString());
        }

        socket.on('disconnect', () => {
            // Socket.io automatically handles room leaving on disconnect
        });
    });

    return io;
}

export default initializeSocket;
