import { apiClient } from './client';

export const EDI_EXPORT_BUILDUP_ENDPOINT = '/edi/export-buildup';
export const EDI_EXPORT_CWP_ENDPOINT = '/edi/export-cwp';
export const EDI_EXPORT_AWB_MAWB = '/edi/export-awb-mawb';
export const EDI_IMPORT_MASTERWAYBILL_ENDPOINT = '/edi/import-masterwaybill';
export const EDI_DISCREPANCY_CODE_DATATABLE_ENDPOINT = '/edi/discrepancy-codes/datatables';
export const EDI_DISCREPANCY_CODE_ENDPOINT = '/edi/discrepancy-codes';
export const EDI_FSU_MESSAGE_DATATABLE_ENDPOINT = '/edi/fsu-messages/datatables';
export const EDI_FSU_MESSAGE_ENDPOINT = '/edi/fsu-messages';

const ediClient = {
  exportBuildUp: (params) => apiClient.post(EDI_EXPORT_BUILDUP_ENDPOINT, params),
  exportCWP: (params) => apiClient.post(EDI_EXPORT_CWP_ENDPOINT, params),
  parseFhl: (awb) => apiClient.get(`/edi/parse-fhl/${awb}`),
  parseFwb: (awb) => apiClient.get(`/edi/parse-fwb/${awb}`),
  exportAwbMawb: (params) => apiClient.post(EDI_EXPORT_AWB_MAWB, params),
  parseAwbMawb: (mawb) => apiClient.get(`/edi/parse-awb-mawb/${mawb}`),
  parseBuildupMawb: (buildupNumber) =>
    apiClient.get(`/edi/export-buildup-mawb/${buildupNumber}`),
  getImportMasterwaybill: (mawb) => apiClient.get(`${EDI_IMPORT_MASTERWAYBILL_ENDPOINT}/${mawb}`),
  getFwbByMawb: (mawb) => apiClient.get(`/edi/fwb/${mawb}`),
  sendEmailEdi: (param) => apiClient.post('/edi/send-email-edi', param),
  sendEmailFwb: (param) => apiClient.post('/edi/send-email-fwb', param),
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
};

export default ediClient;
