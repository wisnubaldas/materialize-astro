/**
 * Runtime configuration read from Expo public environment variables.
 * Keep API URLs in `.env` and never hardcode backend URLs inside screens.
 */
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  authLoginPath: process.env.EXPO_PUBLIC_AUTH_LOGIN_PATH || '/auth/login',
  authProfilePath: process.env.EXPO_PUBLIC_AUTH_PROFILE_PATH || '/auth/me',
  useMockAuth: String(process.env.EXPO_PUBLIC_USE_MOCK_AUTH || 'true') === 'true',
};
