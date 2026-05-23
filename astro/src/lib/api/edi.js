import { apiClient } from './client';


export const EDI_EXPORT_CWP_ENDPOINT = '/edi/export-cwp';
export const EDI_EXPORT_AWB_MAWB = '/edi/export-awb-mawb';
export const EDI_IMPORT_MASTERWAYBILL_ENDPOINT = '/edi/import-masterwaybill';
export const EDI_DISCREPANCY_CODE_DATATABLE_ENDPOINT = '/edi/discrepancy-codes/datatables';
export const EDI_DISCREPANCY_CODE_ENDPOINT = '/edi/discrepancy-codes';
export const EDI_FSU_MESSAGE_DATATABLE_ENDPOINT = '/edi/fsu-messages/datatables';
export const EDI_FSU_MESSAGE_ENDPOINT = '/edi/fsu-messages';
export const EDI_FFM_BUILD_UP_DATATABLE_ENDPOINT = '/edi/ffm-build-up';
export const EDI_EMAIL_AIRLINES_DATATABLE_ENDPOINT = '/edi/email-airlines/datatables';
export const EDI_EMAIL_AIRLINES_ENDPOINT = '/edi/email-airlines';

const ediClient = {

  exportCWP: (params) => apiClient.post(EDI_EXPORT_CWP_ENDPOINT, params),
  parseFhl: (awb) => apiClient.get(`/edi/parse-fhl/${awb}`),
  getFhlMessage: (mawb) => apiClient.get(`/edi/fhl-message/${encodeURIComponent(mawb)}`),
  parseFwb: (awb) => apiClient.get(`/edi/parse-fwb/${awb}`),
  saveFwb: (payload) => apiClient.post('/edi/fwb', payload),
  previewFwb: (payload) => apiClient.post('/edi/fwb-preview', payload),
  getFwbMessage: (mawb) => apiClient.get(`/edi/fwb-message/${encodeURIComponent(mawb)}`),
  exportAwbMawb: (params) => apiClient.post(EDI_EXPORT_AWB_MAWB, params),
  ffmBuildUpDatatable: (params) => apiClient.post(EDI_FFM_BUILD_UP_DATATABLE_ENDPOINT, params),
  ffmBuildUpDetail: (headerId) =>
    apiClient.get(`${EDI_FFM_BUILD_UP_DATATABLE_ENDPOINT}/${headerId}/details`),
  ffmBuildUpPreview: (headerId) =>
    apiClient.get(`${EDI_FFM_BUILD_UP_DATATABLE_ENDPOINT}/${headerId}/preview`),
  parseAwbMawb: (mawb) => apiClient.get(`/edi/parse-awb-mawb/${mawb}`),

  getImportMasterwaybill: (mawb) => apiClient.get(`${EDI_IMPORT_MASTERWAYBILL_ENDPOINT}/${mawb}`),
  getFwbByMawb: (mawb) => apiClient.get(`/edi/fwb/${mawb}`),
  sendEmailEdi: (param) => apiClient.post('/edi/send-email-edi', param),
  listDiscrepancyCodes: () => apiClient.get(EDI_DISCREPANCY_CODE_ENDPOINT),
  getDiscrepancyCode: (id) => apiClient.get(`${EDI_DISCREPANCY_CODE_ENDPOINT}/${id}`),
  createDiscrepancyCode: (payload) => apiClient.post(EDI_DISCREPANCY_CODE_ENDPOINT, payload),
  updateDiscrepancyCode: (id, payload) => apiClient.put(`${EDI_DISCREPANCY_CODE_ENDPOINT}/${id}`, payload),
  deleteDiscrepancyCode: (id) => apiClient.delete(`${EDI_DISCREPANCY_CODE_ENDPOINT}/${id}`),
  listFsuMessages: () => apiClient.get(EDI_FSU_MESSAGE_ENDPOINT),
  getFsuMessage: (id) => apiClient.get(`${EDI_FSU_MESSAGE_ENDPOINT}/${id}`),
  createFsuMessage: (payload) => apiClient.post(EDI_FSU_MESSAGE_ENDPOINT, payload),
  updateFsuMessage: (id, payload) => apiClient.put(`${EDI_FSU_MESSAGE_ENDPOINT}/${id}`, payload),
  deleteFsuMessage: (id) => apiClient.delete(`${EDI_FSU_MESSAGE_ENDPOINT}/${id}`),

  /**
   * List all email airlines.
   * @returns {Promise<Array>} A promise that resolves to the list of airlines.
   */
  listEmailAirlines: () => apiClient.get(EDI_EMAIL_AIRLINES_ENDPOINT),

  /**
   * Get detail of an email airline.
   * @param {number|string} id - The airline ID.
   * @returns {Promise<Object>} The airline details.
   */
  getEmailAirline: (id) => apiClient.get(`${EDI_EMAIL_AIRLINES_ENDPOINT}/${id}`),

  /**
   * Create a new email airline.
   * @param {Object} payload - The airline data.
   * @returns {Promise<Object>} The created airline.
   */
  createEmailAirline: (payload) => apiClient.post(EDI_EMAIL_AIRLINES_ENDPOINT, payload),

  /**
   * Update an existing email airline.
   * @param {number|string} id - The airline ID.
   * @param {Object} payload - The airline data to update.
   * @returns {Promise<Object>} The updated airline.
   */
  updateEmailAirline: (id, payload) => apiClient.put(`${EDI_EMAIL_AIRLINES_ENDPOINT}/${id}`, payload),

  /**
   * Delete an email airline.
   * @param {number|string} id - The airline ID.
   * @returns {Promise<null>}
   */
  deleteEmailAirline: (id) => apiClient.delete(`${EDI_EMAIL_AIRLINES_ENDPOINT}/${id}`),

  /**
   * Lookup email address for a given airline or flight code.
   * @param {string} code - The airline IATA/ICAO code or flight code.
   * @returns {Promise<Object>} The API response envelope containing the email string.
   */
  lookupAirlineEmail: (code) => apiClient.get(`${EDI_EMAIL_AIRLINES_ENDPOINT}/lookup`, { params: { code } }),
};

export default ediClient;
