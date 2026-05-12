import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Saves the authentication token in Capacitor Preferences.
 * @param {string} token - Token returned by the external API or mock auth.
 * @returns {Promise<void>} Resolves after the token has been persisted.
 */
export async function saveAuthToken(token) {
  await Preferences.set({ key: TOKEN_KEY, value: token });
}

/**
 * Reads the authentication token from Capacitor Preferences.
 * @returns {Promise<string>} Stored token or an empty string when not available.
 */
export async function getAuthToken() {
  const result = await Preferences.get({ key: TOKEN_KEY });
  return result.value || '';
}

/**
 * Saves a small user object for app display purposes.
 * @param {{ id?: string|number, name?: string, username?: string }} user - Minimal user session data.
 * @returns {Promise<void>} Resolves after user data has been persisted.
 */
export async function saveAuthUser(user) {
  await Preferences.set({ key: USER_KEY, value: JSON.stringify(user || {}) });
}

/**
 * Reads the stored user object from Capacitor Preferences.
 * @returns {Promise<object|null>} Parsed user object or null when not available.
 */
export async function getAuthUser() {
  const result = await Preferences.get({ key: USER_KEY });

  if (!result.value) {
    return null;
  }

  try {
    return JSON.parse(result.value);
  } catch (error) {
    // Invalid stored JSON should not break app startup.
    return null;
  }
}

/**
 * Clears all authentication-related values from local persistent storage.
 * @returns {Promise<void>} Resolves after token and user data are removed.
 */
export async function clearAuthStorage() {
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.remove({ key: USER_KEY });
}
