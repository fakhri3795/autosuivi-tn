import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../domain/entities/User';
import { mockUser } from '../../data/datasources/MockDataSource';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'autosuivi_auth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedAuth = await AsyncStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        const userData = JSON.parse(storedAuth);
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, _password: string): Promise<boolean> => {
    try {
      // Mock login - in production, call your API
      if (email && _password) {
        const userData = { ...mockUser, email };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (name: string, email: string, _password: string): Promise<boolean> => {
    try {
      // Mock signup - in production, call your API
      if (name && email && _password) {
        const userData: User = {
          id: `user-${Date.now()}`,
          email,
          name,
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
