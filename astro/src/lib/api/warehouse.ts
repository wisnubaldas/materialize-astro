import { apiClient } from './client';
import type {
  BuildUpDetail,
  DataTableRequest,
  DataTableResponse,
  ExportBuildupRow,
  ManifestFlight,
  MasterWaybillBulkRequest,
} from './types/warehouse';

export const WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT = '/warehouse/manifest-flight';
export const WAREHOUSE_FEDEX_MANIFEST_SUBMIT_ENDPOINT = '/warehouse/submit-fedex-manifest';
export const WAREHOUSE_MASTERWAYBILL_BULK_ENDPOINT = '/warehouse/masterwaybill/bulk';

const warehouseClient = {
  manifestFlightDatatable: (params: DataTableRequest) =>
    apiClient.post<DataTableResponse<ManifestFlight>>(
      WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT,
      params
    ),
  manifestFlightDetail: (headerId: number | string) =>
    apiClient.get<BuildUpDetail[]>(
      `${WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT}/${headerId}/details`
    ),
  manifestFlightDelete: (headerId: number | string) =>
    apiClient.delete(`${WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT}/${headerId}`),
  submitFedexManifest: (formData: FormData) =>
    apiClient.post(WAREHOUSE_FEDEX_MANIFEST_SUBMIT_ENDPOINT, formData),
  masterwaybillBulk: (payload: MasterWaybillBulkRequest) =>
    apiClient.post<ExportBuildupRow[]>(WAREHOUSE_MASTERWAYBILL_BULK_ENDPOINT, payload),
};

export default warehouseClient;
export type {
  BuildUpDetail,
  DataTableColumn,
  DataTableFilters,
  DataTableOrder,
  DataTableRequest,
  DataTableResponse,
  DataTableSearch,
  ManifestFlight,
  ExportBuildupRow,
  MasterWaybillBulkRequest,
} from './types/warehouse';
