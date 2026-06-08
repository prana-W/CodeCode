import React, {createContext, useContext, useEffect, useState} from 'react';
import {io} from 'socket.io-client';
import {useAuth} from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({children}) => {
    const {user} = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // We assume token is stored in cookies, so withCredentials will send it
        // If not, we could manually extract it and send via auth object
        const socketUrl = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
            : 'http://localhost:8000';

        const newSocket = io(socketUrl, {
            withCredentials: true,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{socket}}>
            {children}
        </SocketContext.Provider>
    );
};
