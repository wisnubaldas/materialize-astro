
import { apiClient } from './client';

export interface DataTableSearch {
  value?: string;
  regex?: boolean;
}

export interface DataTableColumn {
  data?: string;
  name?: string;
  searchable?: boolean;
  orderable?: boolean;
  search?: DataTableSearch;
}

export interface DataTableOrder {
  column: number;
  dir: 'asc' | 'desc';
  name?: string | null;
}

export interface DataTableFilters {
  airline_code?: string | null;
  flight_number?: string | null;
  flight_date?: string | null;
  point_of_loading?: string | null;
  point_of_unloading?: string | null;
}

export interface DataTableRequest {
  draw: number;
  start: number;
  length: number;
  search: DataTableSearch;
  order: DataTableOrder[];
  columns: DataTableColumn[];
  filters?: DataTableFilters | null;
}

export interface DataTableResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
}

export interface ManifestFlight {
  id: number;
  airline_code?: string | null;
  flight_number?: string | null;
  flight_date?: string | null;
  aircraft_registration?: string | null;
  point_of_loading?: string | null;
  point_of_unloading?: string | null;
  total_pieces?: number | null;
  total_weight_kg?: number | null;
  source_document?: string | null;
  raw_text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ManifestFlightDetailRow {
  uld_type?: string | null;
  uld_number?: string | null;
  uld_owner?: string | null;
  destination?: string | null;
  remarks?: string | null;
  mawb_prefix?: string | null;
  mawb_number?: string | null;
  pieces?: number | null;
  weight_kg?: number | null;
  nature_of_goods?: string | null;
  route?: string | null;
  transit_flag?: boolean | number | null;
}

export interface ManifestFlightDetailResponse {
  flight: ManifestFlight;
  details: ManifestFlightDetailRow[];
}

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
