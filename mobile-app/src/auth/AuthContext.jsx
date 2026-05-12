import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loginRequest } from '../services/authService.js';
import { clearAuthStorage, getAuthToken, getAuthUser, saveAuthToken, saveAuthUser } from '../services/storageService.js';

const AuthContext = createContext(null);

/**
 * Provides authentication state and actions to the entire application.
 * This provider is the single source of truth for login status, token presence, and current user data.
 * @param {{ children: React.ReactNode }} props - React provider props.
 * @returns {JSX.Element} Auth context provider wrapper.
 */
export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    /**
     * Loads an existing stored session when the app starts.
     * @returns {Promise<void>} Resolves after session state is restored or cleared.
     */
    async function loadStoredSession() {
      const token = await getAuthToken();
      const storedUser = await getAuthUser();

      setIsAuthenticated(Boolean(token));
      setUser(storedUser);
      setIsLoading(false);
    }

    loadStoredSession();
  }, []);

  /**
   * Logs a user in, persists the token, and updates global auth state.
   * @param {{ username: string, password: string }} credentials - Login form values.
   * @returns {Promise<void>} Resolves when login state has been updated.
   */
  async function login(credentials) {
    const session = await loginRequest(credentials);

    await saveAuthToken(session.token);
    await saveAuthUser(session.user);

    setUser(session.user);
    setIsAuthenticated(true);
  }

  /**
   * Logs the user out and removes all stored authentication data.
   * @returns {Promise<void>} Resolves after authentication data has been cleared.
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
      login,
      logout
    }),
    [isLoading, isAuthenticated, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads authentication state and actions from AuthContext.
 * @returns {{ isLoading: boolean, isAuthenticated: boolean, user: object|null, login: Function, logout: Function }} Auth context value.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
