import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

const getCookie = (name) => document.cookie
  .split('; ')
  .find((cookie) => cookie.startsWith(`${name}=`))
  ?.split('=')
  .slice(1)
  .join('=');

axios.interceptors.request.use((config) => {
  const method = String(config.method || 'get').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('csrfToken');
    if (csrfToken) {
      config.headers = {
        ...config.headers,
        'x-csrf-token': decodeURIComponent(csrfToken),
      };
    }
  }

  return config;
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get('/api/auth/csrf-token');
        const { data } = await axios.get('/api/auth/me');
        setUser(data.user);
      } catch (_err) {
        try {
          const { data } = await axios.post('/api/auth/refresh');
          setUser(data.user);
        } catch (_refreshError) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, email, password) => {
    const { data } = await axios.post('/api/auth/signup', { name, email, password });
    setUser(data.user);
    return data.user;
  };

  const loginWithDemo = async () => {
    const { data } = await axios.post('/api/auth/demo');
    setUser(data.user);
    return data.user;
  };

  const forgotPassword = async (email) => {
    const { data } = await axios.post('/api/auth/forgot-password', { email });
    return data.message;
  };

  const updatePreferences = async (preferences) => {
    const { data } = await axios.patch('/api/auth/preferences', preferences);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    login,
    signup,
    loginWithDemo,
    forgotPassword,
    updatePreferences,
    logout,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
