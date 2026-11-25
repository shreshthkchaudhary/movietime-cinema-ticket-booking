import { io } from 'socket.io-client';
import { refreshAccessToken } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

// Create a Socket.IO client authenticated with the stored JWT access token
export function createSeatSocket() {
  const socket = io(SOCKET_URL, {
    auth: {
      token: localStorage.getItem('accessToken'),
    },
  });

  let hasTriedRefresh = false;

  // Reset refresh retry flag whenever a connection succeeds
  socket.on('connect', () => {
    hasTriedRefresh = false;
  });

  // If the handshake fails due to an expired token, refresh once and reconnect
  socket.on('connect_error', async (err) => {
    if (!hasTriedRefresh && err.message && err.message.toLowerCase().includes('token')) {
      hasTriedRefresh = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        socket.auth = { token: newToken };
        socket.connect();
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-logout'));
      }
    }
  });

  return socket;
}
