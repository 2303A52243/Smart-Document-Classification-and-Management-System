import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smart_doc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('smart_doc_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smart_doc_token');
    localStorage.removeItem('smart_doc_user');
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('smart_doc_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('smart_doc_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [logout]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (!res.data || typeof res.data !== 'object' || !res.data.access_token) {
      if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE')) {
        throw new Error('Frontend is not communicating with backend API. VITE_API_BASE_URL is missing or misconfigured in Vercel.');
      }
      throw new Error('Invalid response received from server.');
    }
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('smart_doc_token', access_token);
    localStorage.setItem('smart_doc_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    if (!res.data || typeof res.data !== 'object' || !res.data.access_token) {
      if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE')) {
        throw new Error('Frontend is not communicating with backend API. VITE_API_BASE_URL is missing or misconfigured in Vercel.');
      }
      throw new Error('Invalid response received from server.');
    }
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('smart_doc_token', access_token);
    localStorage.setItem('smart_doc_user', JSON.stringify(userData));
    return userData;
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('smart_doc_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
