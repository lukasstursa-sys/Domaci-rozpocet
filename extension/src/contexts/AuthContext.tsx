import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, familyName: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('dr_token');
    const savedUser = localStorage.getItem('dr_user');
    if (savedToken && savedUser) {
      api.setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, user: userData } = await api.login(email, password);
      api.setToken(token);
      localStorage.setItem('dr_token', token);
      localStorage.setItem('dr_user', JSON.stringify(userData));
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Přihlášení selhalo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, familyName: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const { token, user: userData } = await api.register(email, password, familyName);
        api.setToken(token);
        localStorage.setItem('dr_token', token);
        localStorage.setItem('dr_user', JSON.stringify(userData));
        setUser(userData);
      } catch (err: any) {
        setError(err.message || 'Registrace selhala');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    api.clearToken();
    localStorage.removeItem('dr_token');
    localStorage.removeItem('dr_user');
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musí být použit uvnitř AuthProvider');
  }
  return context;
}
