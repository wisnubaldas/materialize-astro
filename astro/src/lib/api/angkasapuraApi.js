import { apiClient } from './client';

export const angkasapuraApi = {
  uploadInvoiceExcel: (formData) => apiClient.post('/angkasapura/upload-invoice-excel', formData),
  getUploadInvoiceExcelStatus: () => apiClient.get('/angkasapura/upload-invoice-excel/status'),
};
