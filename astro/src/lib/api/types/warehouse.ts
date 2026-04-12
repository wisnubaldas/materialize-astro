import type {
  DataTableColumn,
  DataTableOrder,
  DataTableRequest as BaseDataTableRequest,
  DataTableResponse as BaseDataTableResponse,
  DataTableSearch,
} from './datatable';

export interface DataTableFilters {
  number_build_up?: string | null;
  airlines_code?: string | null;
  flight_date?: string | null;
  origin?: string | null;
  dest?: string | null;
}

export type DataTableRequest = BaseDataTableRequest<DataTableFilters>;
export type DataTableResponse<T> = BaseDataTableResponse<T>;
export type { DataTableColumn, DataTableOrder, DataTableSearch };

export interface ManifestFlight {
  id: number;
  number_build_up?: string | null;
  airlines_code?: string | null;
  origin?: string | null;
  dest?: string | null;
  flight_date?: string | null;
  for_official_use?: string | null;
  total_pieces?: number | null;
  total_weight?: number | null;
  pdf_link?: string | null;
  create_at?: string | null;
  update_at?: string | null;
}

export interface BuildUpDetail {
  id: number;
  header_id: number;
  mawb?: string | null;
  uld_number?: string | null;
  uld_type?: string | null;
  pieces?: number | null;
  weight?: number | null;
  nature_of_goods?: string | null;
  remark?: string | null;
  create_at?: string | null;
}

export interface ExportBuildupRow {
  mawb: string;
  airlines_code?: string | null;
  flight_number?: string | null;
  origin?: string | null;
  dest?: string | null;
  flight_date?: string | null;
  pieces?: number | null;
  total_pieces?: number | null;
  weight?: number | null;
  total_weight?: number | null;
  nature_of_goods?: string | null;
}

export interface MasterWaybillBulkRequest {
  MasterAWB: string[];
}
