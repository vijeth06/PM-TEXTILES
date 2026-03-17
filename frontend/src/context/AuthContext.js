import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { authAPI } from '../services/api';
import socketService from '../services/socketService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios default headers
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, twoFactorToken = '') => {
    try {
      const loginPayload = { username, password };
      if (twoFactorToken && twoFactorToken.trim()) {
        loginPayload.twoFactorToken = twoFactorToken.trim();
      }
      const response = await authAPI.login(loginPayload);
      const { token, refreshToken, user } = response.data.data;
      
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      setToken(token);
      setUser(user);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Connect WebSocket
      socketService.connect(token);
      
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        requireTwoFactor: Boolean(error.response?.data?.require2FA),
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    
    // Disconnect WebSocket
    socketService.disconnect();
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions?.includes('system_admin') || user.permissions?.includes(permission);
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role || user.role === 'admin';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
