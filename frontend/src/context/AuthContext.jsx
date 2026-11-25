import { createContext, useContext, useEffect, useState } from 'react';
import apiFetch from '../services/api';

const AuthContext = createContext(null);

// Provides logged-in user state and auth actions to the entire React app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Save user and tokens to state + localStorage after login or register
  function saveSession(data) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  // Clear local session state
  function clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }

  // On initial app load, verify the stored token with GET /api/auth/me
  useEffect(() => {
    async function verifyUser() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch('/api/auth/me');
        const normalized = { ...data.user, id: data.user._id || data.user.id };
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    verifyUser();

    // Listen for forced logout triggered when token refresh fails
    const handleForceLogout = () => clearSession();
    window.addEventListener('auth-logout', handleForceLogout);
    return () => window.removeEventListener('auth-logout', handleForceLogout);
  }, []);

  // Log in an existing user
  async function login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data);
    return data.user;
  }

  // Register a new customer account
  async function register(name, email, password) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    saveSession(data);
    return data.user;
  }

  // Log out on the server and clear localStorage
  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout and clear local session anyway
    }
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook to read AuthContext in components
export function useAuth() {
  return useContext(AuthContext);
}
