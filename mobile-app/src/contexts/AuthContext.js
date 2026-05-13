import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loginRequest } from '../services/authService';
import {
  clearAuthStorage,
  getAuthToken,
  getAuthUser,
  saveAuthToken,
  saveAuthUser,
} from '../services/storageService';

const AuthContext = createContext(null);

/**
 * Provides authentication state and actions to the mobile app.
 * @param {{ children: React.ReactNode }} props - Provider props.
 * @returns {React.ReactElement} Auth provider wrapper.
 */
export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [bootError, setBootError] = useState('');

  useEffect(() => {
    /**
     * Restores a persisted auth session on app launch.
     * @returns {Promise<void>} Resolves after session state is loaded.
     */
    async function loadStoredSession() {
      try {
        const token = await getAuthToken();
        const storedUser = await getAuthUser();

        setIsAuthenticated(Boolean(token));
        setUser(storedUser);
        setBootError('');
      } catch (error) {
        console.error('[auth] Gagal memuat session tersimpan', error);
        setIsAuthenticated(false);
        setUser(null);
        setBootError('Session lokal gagal dimuat. Silakan login ulang.');
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredSession();
  }, []);

  /**
   * Logs in and stores the backend token and user profile.
   * @param {{ email: string, password: string }} credentials - Login form values.
   * @returns {Promise<void>} Resolves after auth state is updated.
   */
  async function login(credentials) {
    const session = await loginRequest(credentials);

    await saveAuthToken(session.token);
    await saveAuthUser(session.user);

    setUser(session.user);
    setIsAuthenticated(true);
  }

  /**
   * Logs out and clears persisted auth state.
   * @returns {Promise<void>} Resolves after auth data is removed.
   */
  async function logout() {
    await clearAuthStorage();
    setUser(null);
    setIsAuthenticated(false);
  }

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      bootError,
      login,
      logout,
    }),
    [isLoading, isAuthenticated, user, bootError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads the current authentication context.
 * @returns {{ isLoading: boolean, isAuthenticated: boolean, user: object|null, bootError: string, login: Function, logout: Function }} Auth state.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
