import { apiClient } from './client';

export const angkasapuraApi = {
  uploadInvoiceExcel: (formData: FormData) =>
    apiClient.post('/angkasapura/upload-invoice-excel', formData),
};

