import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export const useSocket = (token) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    if (!socketInstance) {
      socketInstance = io(process.env.REACT_APP_SOCKET_URL || '', {
        withCredentials: true,
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }
    socketRef.current = socketInstance;
    return () => {};
  }, [token]);

  return socketRef.current;
};

export const getSocket = () => socketInstance;
