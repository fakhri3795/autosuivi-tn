/**
 * AuthContext — Refactored to use real backend API via AuthRemoteDataSource.
 *
 * Changes from mock version:
 * - Login/signup now call the real API endpoints
 * - JWT token is stored and managed via TokenStorage (ApiClient)
 * - User profile is persisted in AsyncStorage as a cache
 * - On 401, the onUnauthorized callback triggers automatic logout
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../domain/entities/User';
import { AuthRemoteDataSource } from '../../data/datasources/remote/AuthRemoteDataSource';
import { TokenStorage, setOnUnauthorized, ApiError } from '../../core/network/ApiClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Last auth error message (cleared on next attempt) */
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CACHE_KEY = 'autosuivi_user_cache';

const authDataSource = new AuthRemoteDataSource();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    // Register the 401 callback so ApiClient can trigger logout
    setOnUnauthorized(() => {
      handleLogout();
    });
  }, []);

  /** On app start, check if we have a cached user + valid token */
  const checkAuth = async () => {
    try {
      const token = await TokenStorage.getToken();
      const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);

      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));

        // Optionally validate the token by fetching the profile
        try {
          const freshUser = await authDataSource.getProfile();
          setUser(freshUser);
          await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(freshUser));
        } catch {
          // Profile fetch failed (network issue) — keep cached user for offline UX
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const response = await authDataSource.login(email, password);

      // Persist token
      await TokenStorage.setToken(response.token);
      if (response.refreshToken) {
        await TokenStorage.setRefreshToken(response.refreshToken);
      }

      // Cache user
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.user));
      setUser(response.user);
      return true;
    } catch (error) {
      let message: string;
      if (error instanceof ApiError) {
        // Add login-specific context for certain status codes
        if (error.statusCode === 401 || error.statusCode === 403) {
          message = 'Email ou mot de passe incorrect. V\u00e9rifiez vos identifiants.';
        } else {
          message = error.message;
        }
      } else {
        message = 'Impossible de se connecter. V\u00e9rifiez votre connexion Internet.';
      }
      setAuthError(message);
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    setAuthError(null);
    try {
      const response = await authDataSource.register(name, email, password);

      await TokenStorage.setToken(response.token);
      if (response.refreshToken) {
        await TokenStorage.setRefreshToken(response.refreshToken);
      }

      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.user));
      setUser(response.user);
      return true;
    } catch (error) {
      let message: string;
      if (error instanceof ApiError) {
        // Add signup-specific context for certain status codes
        if (error.statusCode === 409) {
          message = 'Cette adresse email est d\u00e9j\u00e0 utilis\u00e9e. Essayez de vous connecter.';
        } else {
          message = error.message;
        }
      } else {
        message = 'Impossible de cr\u00e9er le compte. V\u00e9rifiez votre connexion Internet.';
      }
      setAuthError(message);
      console.error('Signup error:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await TokenStorage.clearTokens();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const logout = async () => {
    await handleLogout();
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
        authError,
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
