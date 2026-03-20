import { apiClient } from './client';
import type { PaggingDataTerkirim } from './types/hubnet';
export const hubnetApi = {
  // Return the resolved payload so callers can consume the dashboard data.
  sendingPerbulan: (bulan:string) => apiClient.get(`/hubnet/sending-per-bulan/${bulan}`),
  sendingStatusSummaryPerbulan: (bulan: string) =>
    apiClient.get(`/hubnet/sending-status-summary/${bulan}`),
  // Forward params as query string (?page=1&per_page=10...)
  getDataTerkirim: (params: PaggingDataTerkirim) =>
    apiClient.get('/hubnet/get-data-terkirim/', { params: params as Record<string, any> }),
  postDataTable: () => {
    return '/hubnet/data-terkirim';
  },
  // Upload manifest excel via multipart/form-data.
  uploadManifests: (formData: FormData) => apiClient.post('/hubnet/upload-manifests', formData),
  uploadOutgoing: (formData: FormData) => apiClient.post('/hubnet/upload-outgoing', formData),
  exportExcel: (bulan: string) =>
    apiClient.get(`/hubnet/export-excel/${bulan}`, {
      headers: {
        Accept: 'application/pdf',
      },
      raw: true,
    }),
};
