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

export interface MasterWaybill {
  MasterAWB: string;
  Pieces?: number | null;
  Weight?: number | null;
  Volume?: number | null;
  AirlinesCode?: string | null;
  FlightNo?: string | null;
  Origin?: string | null;
  Destination?: string | null;
  DateOfFlight?: string | null;
  KindOfGood?: string | null;
  KindOfCode?: string | null;
  PENnumber?: string | null;
  KTKR?: string | null;
  DateOfPen?: string | null;
  HSCode?: string | null;
  AgenCode?: string | null;
  ShipperCode?: string | null;
  ConsigneeCode?: string | null;
  bc11?: string | null;
  tglbc11?: string | null;
  nopos?: string | null;
  Multihost?: string | null;
  Parsial?: string | null;
  DateOfOut?: string | null;
  TimeOut?: string | null;
  DateOfIn?: string | null;
  TimeIn?: string | null;
  RCS?: boolean | number | null;
  FWB?: boolean | number | null;
  PDE?: boolean | number | null;
  Status?: boolean | number | null;
  DateEntry?: string | null;
  TimeEntry?: string | null;
  void?: boolean | number | null;
  token?: string | null;
  created_at?: string | null;
}

export interface MasterWaybillBulkRequest {
  MasterAWB: string[];
}
