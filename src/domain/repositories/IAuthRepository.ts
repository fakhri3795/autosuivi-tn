/**
 * IAuthRepository - Domain-layer contract for authentication operations.
 */

import { User } from '../entities/User';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface IAuthRepository {
  /** Login with email and password */
  login(email: string, password: string): Promise<AuthResponse>;

  /** Register a new user */
  register(name: string, email: string, password: string): Promise<AuthResponse>;

  /** Get the currently authenticated user profile */
  getProfile(): Promise<User>;

  /** Logout (clear tokens) */
  logout(): Promise<void>;
}
