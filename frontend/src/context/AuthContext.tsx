import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  hasPostedToday: boolean;
  setHasPostedToday: (val: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPostedToday, setHasPostedToday] = useState(false);

  //checks if we already have a saved token on app start, if yes, we are authenticated and we can fetch user data (like username) from secure storage.
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('vulse_token');
        const storedUser = await SecureStore.getItemAsync('vulse_user');
        
        if (token) {
          setIsAuthenticated(true);
          setUsername(storedUser);
        }
      } catch (error) {
        console.error("Error reading token:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    const { token, username } = response.data;

    await SecureStore.setItemAsync('vulse_token', token);
    await SecureStore.setItemAsync('vulse_user', username);
    
    setUsername(username);
    setIsAuthenticated(true);
  };

  const register = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    const { token, username } = response.data;

    await SecureStore.setItemAsync('vulse_token', token);
    await SecureStore.setItemAsync('vulse_user', username);
    
    setUsername(username);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('vulse_token');
    await SecureStore.deleteItemAsync('vulse_user');
    setIsAuthenticated(false);
    setUsername(null);
  };

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          try {
            await logout();
          } catch (logoutError) {
            console.error("Error during auto-logout:", logoutError);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, isLoading, login, register, logout, hasPostedToday, setHasPostedToday }}>
      {children}
    </AuthContext.Provider>
  );
};  