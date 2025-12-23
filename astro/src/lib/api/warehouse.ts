
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
  MasterAWB?: string | null;
  AirlinesCode?: string | null;
  FlightNo?: string | null;
  Origin?: string | null;
  Destination?: string | null;
  KindOfGood?: string | null;
  AgenCode?: string | null;
  ShipperCode?: string | null;
  ConsigneeCode?: string | null;
  DateOfFlight?: string | null;
  DateEntry?: string | null;
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

export const WAREHOUSE_AWB_DATATABLE_ENDPOINT = '/warehouse/awb-data-for-buildup';

const warehouseClient = {
  awbDataForBuildup: (params: DataTableRequest) =>
    apiClient.post<DataTableResponse<MasterWaybill>>(WAREHOUSE_AWB_DATATABLE_ENDPOINT, params),
};

export default warehouseClient;
