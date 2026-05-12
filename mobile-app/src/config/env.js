/**
 * Stores environment-driven app configuration in one place.
 * Pages and services must read API-related values from this module instead of hardcoding them.
 */
export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'Simple Mobile App',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://your-api-domain.com/api',
  useMockAuth: import.meta.env.VITE_USE_MOCK_AUTH !== 'false',
  authLoginPath: import.meta.env.VITE_AUTH_LOGIN_PATH || '/auth/login'
};

/**
 * Centralized route paths used by the router and navigation handlers.
 */
export const routePaths = {
  login: '/login',
  dashboard: '/dashboard'
};
