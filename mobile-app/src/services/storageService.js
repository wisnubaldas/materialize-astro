import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'mau.auth.token';
const AUTH_USER_KEY = 'mau.auth.user';

/**
 * Persists the backend access token.
 * @param {string} token - Backend JWT access token.
 * @returns {Promise<void>} Resolves after storage is updated.
 */
export async function saveAuthToken(token) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Reads the stored backend access token.
 * @returns {Promise<string|null>} Stored token or null.
 */
export function getAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Persists the authenticated user profile.
 * @param {object} user - User profile returned by backend.
 * @returns {Promise<void>} Resolves after storage is updated.
 */
export async function saveAuthUser(user) {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Reads the stored authenticated user profile.
 * @returns {Promise<object|null>} Stored user profile or null.
 */
export async function getAuthUser() {
  const value = await AsyncStorage.getItem(AUTH_USER_KEY);
  return value ? JSON.parse(value) : null;
}

/**
 * Clears all persisted authentication data.
 * @returns {Promise<void>} Resolves after storage is cleared.
 */
export async function clearAuthStorage() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
}
