import { apiClient } from './client';

export const WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT = '/warehouse/manifest-flight';
export const WAREHOUSE_FEDEX_MANIFEST_SUBMIT_ENDPOINT = '/warehouse/submit-fedex-manifest';
export const WAREHOUSE_MASTERWAYBILL_BULK_ENDPOINT = '/warehouse/masterwaybill/bulk';
export const WAREHOUSE_BUILD_UP_DRAFT_ENDPOINT = '/warehouse/build-up-drafts';

const warehouseClient = {
  manifestFlightDatatable: (params) =>
    apiClient.post(WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT, params),
  manifestFlightDetail: (headerId) =>
    apiClient.get(`${WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT}/${headerId}/details`),
  manifestFlightFfmPreview: (headerId) =>
    apiClient.get(`${WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT}/${headerId}/ffm-preview`),
  manifestFlightDelete: (headerId) =>
    apiClient.delete(`${WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT}/${headerId}`),
  submitFedexManifest: (formData) => apiClient.post(WAREHOUSE_FEDEX_MANIFEST_SUBMIT_ENDPOINT, formData),
  masterwaybillBulk: (payload) => apiClient.post(WAREHOUSE_MASTERWAYBILL_BULK_ENDPOINT, payload),
  listBuildUpDrafts: () => apiClient.get(WAREHOUSE_BUILD_UP_DRAFT_ENDPOINT),
  createBuildUpDraft: (payload) => apiClient.post(WAREHOUSE_BUILD_UP_DRAFT_ENDPOINT, payload),
  updateBuildUpDraft: (draftId, payload) =>
    apiClient.put(`${WAREHOUSE_BUILD_UP_DRAFT_ENDPOINT}/${draftId}`, payload),
  deleteBuildUpDraft: (draftId) =>
    apiClient.delete(`${WAREHOUSE_BUILD_UP_DRAFT_ENDPOINT}/${draftId}`),
};

export default warehouseClient;
