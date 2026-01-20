import { apiClient } from './client';
import type {
  DataTableRequest,
  DataTableResponse,
  ManifestFlight,
  ManifestFlightDetailResponse,
} from './types/warehouse';

export const WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT = '/warehouse/manifest-flight';
export const WAREHOUSE_FEDEX_MANIFEST_UPLOAD_ENDPOINT = '/warehouse/upload-fedex-manifest';

const warehouseClient = {
  manifestFlightDatatable: (params: DataTableRequest) =>
    apiClient.post<DataTableResponse<ManifestFlight>>(
      WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT,
      params
    ),
  manifestFlightDetail: (flightId: string | number) =>
    apiClient.get<ManifestFlightDetailResponse>(`/warehouse/manifest-flight/${flightId}`),
  uploadFedexManifest: (formData: FormData) =>
    apiClient.post(WAREHOUSE_FEDEX_MANIFEST_UPLOAD_ENDPOINT, formData),
};

export default warehouseClient;
export type {
  DataTableColumn,
  DataTableFilters,
  DataTableOrder,
  DataTableRequest,
  DataTableResponse,
  DataTableSearch,
  ManifestFlight,
  ManifestFlightDetailResponse,
  ManifestFlightDetailRow,
} from './types/warehouse';
