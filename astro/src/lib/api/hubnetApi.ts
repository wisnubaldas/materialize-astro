import { apiClient } from './client';
interface paggingDataTerkirim {
  flt_date?: string;
  page?: number;
  per_page?: number;
}
export const hubnetApi = {
  // Return the resolved payload so callers can consume the dashboard data.
  dashboardCard: () => apiClient.get('/hubnet/dashboard-card'),
  // Forward params as query string (?page=1&per_page=10...)
  getDataTerkirim: (params: paggingDataTerkirim) =>
    apiClient.get('/hubnet/get-data-terkirim/', { params: params as Record<string, any> }),
  postDataTable: () => {
    return '/hubnet/data-terkirim';
  },
  // Upload manifest excel via multipart/form-data.
  uploadManifests: (formData: FormData) => apiClient.post('/hubnet/upload-manifests', formData),
  exportExcel: (bulan: string) =>
    apiClient.get(`/hubnet/export-excel/${bulan}`, {
      headers: {
        Accept: 'application/pdf',
      },
      raw: true,
    }),
};
