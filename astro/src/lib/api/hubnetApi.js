import { apiClient } from './client';

export const hubnetApi = {
  sendingPerbulan: (bulan) => apiClient.get(`/hubnet/sending-per-bulan/${bulan}`),
  sendingStatusSummaryPerbulan: (bulan) => apiClient.get(`/hubnet/sending-status-summary/${bulan}`),
  getDataTerkirim: (params) => apiClient.get('/hubnet/get-data-terkirim/', { params }),
  postDataTable: () => '/hubnet/data-terkirim',
  uploadManifests: (formData) => apiClient.post('/hubnet/upload-manifests', formData),
  uploadOutgoing: (formData) => apiClient.post('/hubnet/upload-outgoing', formData),
  exportExcel: (bulan) =>
    apiClient.get(`/hubnet/export-excel/${bulan}`, {
      headers: {
        Accept: 'application/pdf',
      },
      raw: true,
    }),
};
