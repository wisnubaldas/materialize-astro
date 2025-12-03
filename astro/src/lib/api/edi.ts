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
  BuildUpNumber?: string | null;
  MasterAWB?: string | null;
  TransitCode?: string | null;
  UldCardNumber?: string | null;
  AgenCode?: string | null;
  DateEntry?: string | null;
  TimeEntry?: string | null;
  ProofNumber?: string | null;
  AirlinesCode?: string | null;
  Origin?: string | null;
  Destination?: string | null;
  FlightNumber?: string | null;
  ShipperCode?: string | null;
  ConsigneeCode?: string | null;
  AgenPIC?: string | null;
  DateOfFlight?: string | null;
  EmployeeNumber?: string | null;
  InvoiceNumber?: string | null;
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

export interface EksBuildUpDetail {
  noid: number;
  BuildUpNumber?: string | null;
  MasterAWB?: string | null;
  Parsial?: string | null;
  TransitCode?: string | null;
  PartPieces?: number | null;
  Pieces?: number | null;
  PartNetto?: number | null;
  Netto?: number | null;
  Volume?: number | null;
  UldCardNumber?: string | null;
  KindOfGood?: string | null;
  EmployeeNumber?: string | null;
  AgenCode?: string | null;
  condition?: string | null;
  OverLoadCode?: string | null;
  DONumber?: string | null;
  Remarks?: string | null;
  OfficialUse?: string | null;
  PrintNumber?: number | null;
  DateEntry?: string | null;
  TimeEntry?: string | null;
  FFM?: boolean | null;
  void?: boolean | null;
  token?: string | null;
  created_at?: string | null;
}

export interface DataTableResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
}

export const EDI_EXPORT_BUILDUP_ENDPOINT = '/edi/export-buildup';
export interface WeighingHeader {
  noid: number;
  ProofNumber?: string | null;
  MasterAWB?: string | null;
  AirlinesCode?: string | null;
  Origin?: string | null;
  Destination?: string | null;
  FlightNumber?: string | null;
  ShipperCode?: string | null;
  AgenCode?: string | null;
  ConsigneeCode?: string | null;
  AgenPIC?: string | null;
  TotalPieces?: number | null;
  TotalPallet?: number | null;
  TotalNetto?: number | null;
  TotalVolume?: number | null;
  TotalCAW?: number | null;
  DateOfFlight?: string | null;
  DateOfEntry?: string | null;
  TimeOfEntry?: string | null;
  BookingCode?: string | null;
  MultiVolume?: string | null;
  PaymentCode?: string | null;
  Directmaster?: boolean | number | null;
  EmployeeNumber?: string | null;
  InvoiceNumber?: string | null;
  PrintNumber?: boolean | number | null;
  report?: boolean | number | null;
  RCS?: boolean | number | null;
  FHL?: boolean | number | null;
  FWB?: boolean | number | null;
  void?: boolean | number | null;
  gateIn?: boolean | number | null;
  token?: string | null;
  created_at?: string | null;
}
export const EDI_EXPORT_CWP_ENDPOINT = '/edi/export-cwp';
export interface WeighingDetail {
  noid: number;
  ProofNumber?: string | null;
  MasterAWB: string;
  HostAWB?: string | null;
  Pieces?: number | null;
  Pallet?: number | null;
  GrossWeight?: number | null;
  NettoWeight?: number | null;
  LongCargo?: number | null;
  WidthCargo?: number | null;
  HighCargo?: number | null;
  VolumeCargo?: number | null;
  CAW?: number | null;
  StorageRoom?: string | null;
  DG?: string | null;
  KindOfCode?: string | null;
  KindOfNature?: string | null;
  BuildUpFlag?: boolean | number | null;
  DateEntry?: string | null;
  TimeEntry?: string | null;
  token?: string | null;
  created_at?: string | null;
}

export interface ParseFhlResponse {
  header: WeighingHeader | null;
  details: WeighingDetail[];
}
const ediClient = {
  exportBuildUp: (params: DataTableRequest) =>
    apiClient.post<DataTableResponse<EksBuildUpDetail>>(EDI_EXPORT_BUILDUP_ENDPOINT, params),
  exportCWP: (params: DataTableRequest) =>
    apiClient.post<DataTableResponse<WeighingHeader>>(EDI_EXPORT_CWP_ENDPOINT, params),
  parseFhl: (awb: string) => apiClient.get<ParseFhlResponse>(`/edi/parse-fhl/${awb}`),
};

export default ediClient;
