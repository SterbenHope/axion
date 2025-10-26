import { useState, useEffect, useContext, createContext } from 'react';
import AuthService from '../../services/AuthService';
import axios from 'axios';
import { API_URL } from '../../http';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const updateUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userResponse = await axios.get(`${API_URL}/auth/user/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = userResponse.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const checkAuth = async () => {
    // Don't set loading - this runs in background
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return;
      }
      
      const response = await axios.post(`${API_URL}/auth/token/refresh/`, { 
        refresh: refreshToken 
      });
      localStorage.setItem('token', response.data.access);
      
      // Получаем данные пользователя отдельно, так как refresh не возвращает user
      const userResponse = await axios.get(`${API_URL}/auth/user/`, {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      
      const userData = userResponse.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.log(error.response?.data?.message);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.login(email, password);
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, referralCode = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.registration(email, password, referralCode);
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Initialization useEffect
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      // Восстанавливаем пользователя из localStorage
      try {
        const user = JSON.parse(savedUser);
        setUser(user);
        setLoading(false); // Set loading to false immediately
        // Проверяем актуальность токена в фоне
        checkAuth();
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    // Auto-refresh user data (including balance) every 10 seconds (silent)
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        updateUserData(); // Silent update - no loading state
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
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


