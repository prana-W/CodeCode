import verifyAccessToken from './middlewares/verifyAccessToken.middleware.js';

function registerSockets(io) {
    // Middleware to verify access token for each socket connection
    io.use(verifyAccessToken());

    io.on('connection', (socket) => {
        console.log('✅ Socket connected:', socket.id);

        // socket.on('packet', handlePacket(socket));

        socket.on('disconnect', () => {
            console.log('Socket disconnected. User:', socket?.userId);
        });
    });
}

export default registerSockets;
