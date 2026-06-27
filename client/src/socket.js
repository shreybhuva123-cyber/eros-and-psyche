import { io } from 'socket.io-client';

export const initSocket = (token) => {
  // If on Vercel, use relative connection (undefined). Otherwise use localhost.
  const socketUrl = window.location.hostname !== 'localhost' 
    ? undefined 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
  return io(socketUrl, {
    auth: { token },
    withCredentials: true,
  });
};
