import { env } from '../config/env';
import { getRequest, postRequest } from './apiService';

/**
 * Builds a query string from simple filter values.
 * @param {object} params - Query parameters.
 * @returns {string} URL query string including `?` when needed.
 */
function buildQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/**
 * Creates one Build Up Check header.
 * @param {object} formData - Header form values.
 * @returns {Promise<object|null>} Created header from backend.
 */
export function createBuildUpCheckHeader(formData) {
  return postRequest(env.buildUpCheckHeadersPath, formData, { authenticated: true });
}

/**
 * Lists Build Up Check headers, optionally filtered by flight date.
 * @param {{ flightDate?: string }} filters - Header filters.
 * @returns {Promise<Array>} Header list.
 */
export async function listBuildUpCheckHeaders(filters = {}) {
  const query = buildQuery({
    flight_date: filters.flightDate,
    completed_only: filters.completedOnly ? 'true' : '',
    unfinished_only: filters.unfinishedOnly === false ? '' : 'true',
  });
  const response = await getRequest(`${env.buildUpCheckHeadersPath}${query}`, {
    authenticated: true,
  });
  return Array.isArray(response) ? response : [];
}

/**
 * Lists completed Build Up Check headers.
 * @param {{ flightDate?: string }} filters - Completed header filters.
 * @returns {Promise<Array>} Completed header list.
 */
export function listCompletedBuildUpCheckHeaders(filters = {}) {
  return listBuildUpCheckHeaders({
    flightDate: filters.flightDate,
    completedOnly: true,
    unfinishedOnly: false,
  });
}

/**
 * Manually closes one Build Up ULD header.
 * @param {number} headerId - Header id.
 * @returns {Promise<object|null>} Closed header.
 */
export function closeBuildUpCheckHeader(headerId) {
  return postRequest(`${env.buildUpCheckHeadersPath}/${headerId}/close`, {}, {
    authenticated: true,
  });
}

/**
 * Manually opens one closed Build Up ULD header.
 * @param {number} headerId - Header id.
 * @returns {Promise<object|null>} Open header.
 */
export function openBuildUpCheckHeader(headerId) {
  return postRequest(`${env.buildUpCheckHeadersPath}/${headerId}/open`, {}, {
    authenticated: true,
  });
}

/**
 * Lists MAWB details for one Build Up Check header.
 * @param {number} headerId - Header id.
 * @returns {Promise<Array>} Detail list.
 */
export async function listBuildUpCheckDetails(headerId) {
  const response = await getRequest(`${env.buildUpCheckHeadersPath}/${headerId}/details`, {
    authenticated: true,
  });
  return Array.isArray(response) ? response : [];
}

/**
 * Gets all-time completed and unfinished Master AWB summary for dashboard cards.
 * @returns {Promise<{ unfinished: number, completed: number }>} Master AWB summary.
 */
export async function getBuildUpMasterAwbSummary() {
  const response = await getRequest(`${env.buildUpCheckHeadersPath}/master-awb-summary`, {
    authenticated: true,
  });
  return {
    unfinished: Number(response?.unfinished || 0),
    completed: Number(response?.completed || 0),
  };
}

/**
 * Creates one MAWB detail under a Build Up Check header.
 * @param {number} headerId - Header id.
 * @param {object} formData - Detail form values.
 * @returns {Promise<object|null>} Created detail.
 */
export function createBuildUpCheckDetail(headerId, formData) {
  return postRequest(`${env.buildUpCheckHeadersPath}/${headerId}/details`, formData, {
    authenticated: true,
  });
}

/**
 * Adds one rincian row to a Build Up Check detail.
 * @param {number} detailId - Detail id.
 * @param {object} formData - Rincian form values.
 * @returns {Promise<object|null>} Updated detail with progress.
 */
export function createBuildUpCheckRincian(detailId, formData) {
  return postRequest(`/warehouse/build-up-check-details/${detailId}/rincian`, formData, {
    authenticated: true,
  });
}

/**
 * Closes one ULD allocation for a Build Up Check detail.
 * @param {number} detailId - Detail id.
 * @returns {Promise<object|null>} Updated detail with final allocation status.
 */
export function closeBuildUpCheckDetailAllocation(detailId) {
  return postRequest(`/warehouse/build-up-check-details/${detailId}/close-allocation`, {}, {
    authenticated: true,
  });
}
