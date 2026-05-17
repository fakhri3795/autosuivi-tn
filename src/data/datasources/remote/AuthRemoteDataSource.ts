/**
 * AuthRemoteDataSource
 *
 * Handles all HTTP requests related to authentication against the backend API.
 */

import apiClient from '../../../core/network/ApiClient';
import { User } from '../../../domain/entities/User';

export interface AuthApiResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export class AuthRemoteDataSource {
  /** POST /api/auth/login */
  async login(email: string, password: string): Promise<AuthApiResponse> {
    const response = await apiClient.post('/auth/login', { email, password });
    const data = response.data;
    return {
      user: data.user ?? data,
      token: data.token ?? data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  /** POST /api/auth/register */
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthApiResponse> {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
    });
    const data = response.data;
    return {
      user: data.user ?? data,
      token: data.token ?? data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  /** GET /api/auth/profile or /api/auth/me */
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    const data = response.data;
    return data.user ?? data.data ?? data;
  }
}
