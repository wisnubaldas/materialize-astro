const DEFAULT_API_TIMEOUT_MS = 10000;
const LOCAL_API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Resolves the API base URL with localhost fallback only for development runtime.
 * @param {string|undefined} value - Raw Expo public API base URL.
 * @returns {string} Configured API base URL, or an empty value when production is misconfigured.
 */
function resolveApiBaseUrl(value) {
  const configuredValue = String(value || '').trim();

  if (configuredValue) {
    return configuredValue;
  }

  return typeof __DEV__ !== 'undefined' && __DEV__ ? LOCAL_API_BASE_URL : '';
}

/**
 * Parses a positive numeric environment value with a safe fallback.
 * @param {string|undefined} value - Raw environment value.
 * @param {number} fallback - Value used when the environment value is invalid.
 * @returns {number} Positive number for runtime configuration.
 */
function parsePositiveNumber(value, fallback) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

/**
 * Runtime configuration read from Expo public environment variables.
 * Keep API URLs in `.env` and never hardcode backend URLs inside screens.
 */
export const env = {
  apiBaseUrl: resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  authLoginPath: process.env.EXPO_PUBLIC_AUTH_LOGIN_PATH || '/auth/login',
  authProfilePath: process.env.EXPO_PUBLIC_AUTH_PROFILE_PATH || '/auth/me',
  buildUpSubmitPath: process.env.EXPO_PUBLIC_BUILD_UP_SUBMIT_PATH || '/warehouse/submit-build-up-manifest',
  buildUpCheckHeadersPath:
    process.env.EXPO_PUBLIC_BUILD_UP_CHECK_HEADERS_PATH || '/warehouse/build-up-check-headers',
  apiTimeoutMs: parsePositiveNumber(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, DEFAULT_API_TIMEOUT_MS),
  useMockAuth: String(process.env.EXPO_PUBLIC_USE_MOCK_AUTH || 'false') === 'true',
};
