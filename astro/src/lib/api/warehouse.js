import { apiClient } from './client';

export const WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT = '/warehouse/manifest-flight';
export const WAREHOUSE_FEDEX_MANIFEST_SUBMIT_ENDPOINT = '/warehouse/submit-fedex-manifest';
export const WAREHOUSE_MASTERWAYBILL_BULK_ENDPOINT = '/warehouse/masterwaybill/bulk';

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
};

export default warehouseClient;
