import { appConfig } from '../config/env.js';
import { postRequest } from './apiService.js';

/**
 * Runs mock authentication for early UI development without depending on an external API.
 * @param {{ username: string, password: string }} credentials - Login form values.
 * @returns {Promise<{ token: string, user: object }>} Mock session data.
 */
async function mockLogin(credentials) {
  const isValidUser = credentials.username === 'admin' && credentials.password === 'admin123';

  if (!isValidUser) {
    throw new Error('Username atau password salah.');
  }

  return {
    token: 'mock-token-for-development-only',
    user: {
      id: 1,
      name: 'Administrator',
      username: 'admin'
    }
  };
}

/**
 * Normalizes common external API login response formats into the app session format.
 * @param {object} response - Raw login response from the external API.
 * @param {{ username: string }} credentials - Original login credentials for fallback display data.
 * @returns {{ token: string, user: object }} Normalized session data.
 */
function normalizeLoginResponse(response, credentials) {
  const token = response?.token || response?.access_token || response?.data?.token || response?.data?.access_token;
  const user = response?.user || response?.data?.user || { username: credentials.username };

  if (!token) {
    throw new Error('Response login tidak memiliki token. Sesuaikan mapping di authService.js.');
  }

  return { token, user };
}

/**
 * Authenticates a user using mock mode or the configured external API login endpoint.
 * @param {{ username: string, password: string }} credentials - Login form values.
 * @returns {Promise<{ token: string, user: object }>} Normalized session data.
 */
export async function loginRequest(credentials) {
  if (appConfig.useMockAuth) {
    return mockLogin(credentials);
  }

  const response = await postRequest(appConfig.authLoginPath, credentials);
  return normalizeLoginResponse(response, credentials);
}
