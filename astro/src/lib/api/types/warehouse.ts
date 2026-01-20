import type {
  DataTableColumn,
  DataTableOrder,
  DataTableRequest as BaseDataTableRequest,
  DataTableResponse as BaseDataTableResponse,
  DataTableSearch,
} from './datatable';

export interface DataTableFilters {
  airline_code?: string | null;
  flight_number?: string | null;
  flight_date?: string | null;
  point_of_loading?: string | null;
  point_of_unloading?: string | null;
}

export type DataTableRequest = BaseDataTableRequest<DataTableFilters>;
export type DataTableResponse<T> = BaseDataTableResponse<T>;
export type { DataTableColumn, DataTableOrder, DataTableSearch };

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
