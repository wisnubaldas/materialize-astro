import { env } from '../config/env';
import { getRequest, postRequest } from './apiService';

/**
 * Runs local mock authentication for UI-only development.
 * @param {{ email: string, password: string }} credentials - Login credentials.
 * @returns {Promise<{ token: string, user: object }>} Mock session.
 */
async function mockLogin(credentials) {
  const isValidUser = credentials.email === 'admin@admin.com' && credentials.password === 'password123';

  if (!isValidUser) {
    throw new Error('Email atau password salah.');
  }

  return {
    token: 'mock-token-for-development-only',
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@admin.com',
      roles: ['admin'],
    },
  };
}

/**
 * Extracts the access token from common backend auth responses.
 * @param {object} response - Backend login response.
 * @returns {string} Access token.
 */
function normalizeLoginToken(response) {
  const token = response?.access_token || response?.token || response?.data?.access_token || response?.data?.token;

  if (!token) {
    throw new Error('Response login tidak memiliki token.');
  }

  return token;
}

/**
 * Authenticates a user against mock mode or the FastAPI backend.
 * @param {{ email: string, password: string }} credentials - Login credentials.
 * @returns {Promise<{ token: string, user: object }>} Auth session.
 */
export async function loginRequest(credentials) {
  if (env.useMockAuth) {
    return mockLogin(credentials);
  }

  const response = await postRequest(env.authLoginPath, {
    email: credentials.email,
    password: credentials.password,
  });
  const token = normalizeLoginToken(response);
  const user = await getRequest(env.authProfilePath, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    token,
    user: user || { email: credentials.email, username: credentials.email },
  };
}
