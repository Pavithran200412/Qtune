import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authenticate user on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/profile');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (e) {
      console.warn('Session restoration failed:', e.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        return true;
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed. Please check credentials.');
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const res = await axios.post('/api/auth/register', { username, email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        return true;
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed. Try again.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setLoading(false);
  };

  const connectSpotifyUser = async (code) => {
    try {
      const res = await axios.post('/api/auth/spotify', { code });
      if (res.data.success) {
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed connecting Spotify:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      connectSpotifyUser,
      fetchUserProfile,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
