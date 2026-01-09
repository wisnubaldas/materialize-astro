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
export interface BuildupHeader {
  noid: number;
  buildup_number?: string | null;
  airlines_code?: string | null;
  flight_number?: string | null;
  destination_code?: string | null;
  date_of_flight?: string | null;
  aircraft_registration?: string | null;
  etd?: string | null;
  time_departure?: string | null;
  total_master_awb?: number | null;
  part_of_pieces?: number | null;
  total_pieces?: number | null;
  part_of_netto?: number | null;
  total_netto?: number | null;
  total_volume?: number | null;
  employee_number?: string | null;
  operator_name?: string | null;
  date_entry?: string | null;
  time_entry?: string | null;
  ffm_message_key?: string | null;
  token?: string | null;
  created_at?: string | null;
  void?: boolean | number | null;
}
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
  shipper?: CustomerInfo | null;
  consignee?: CustomerInfo | null;
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

export interface ParseFwbResponse {
  header: WeighingHeader | null;
  details: WeighingDetail[];
  agen?: CustomerInfo | null;
}

export interface CustomerInfo {
  CustomerCode: string;
  CompanyName?: string | null;
  Address1?: string | null;
  Address2?: string | null;
  City?: string | null;
  CountryCode?: string | null;
  PostCode?: string | null;
  NPWPNumber?: string | null;
  EmailAddress?: string | null;
  ContactNumber?: string | null;
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

export interface HostAwb {
  noid: number;
  MasterAWB?: string | null;
  HostAWB?: string | null;
  kd_kemasan?: string | null;
  Quantity?: number | null;
  Weight?: number | null;
  Volume?: number | null;
  airlinescode?: string | null;
  FlightNo?: string | null;
  DateOfFlight?: string | null;
  kd_doc?: string | null;
  PENnumber?: string | null;
  KTKR?: string | null;
  DateOfPen?: string | null;
  HSCode?: string | null;
  descriptiongoods?: string | null;
  AgenCode?: string | null;
  ShipperCode?: string | null;
  shippername?: string | null;
  shipperaddress?: string | null;
  shippercity?: string | null;
  shippercountry?: string | null;
  shipperpostal?: string | null;
  shipperTaxNo?: string | null;
  ConsigneeCode?: string | null;
  Consigneename?: string | null;
  Consigneeaddress?: string | null;
  Consigneecity?: string | null;
  Consigneecountry?: string | null;
  bc11?: string | null;
  tglbc?: string | null;
  nopos?: string | null;
  subpos?: string | null;
  subsubpos?: string | null;
  DateOfOut?: string | null;
  TimeOut?: string | null;
  DateOfIn?: string | null;
  TimeIn?: string | null;
  FHL?: number | null;
  Status?: number | null;
  DateEntry?: string | null;
  TimeEntry?: string | null;
  void?: number | null;
  token?: string | null;
  created_at?: string | null;
}

export interface ParseAwbMawbResponse {
  master: MasterWaybill | null;
  host_awbs: HostAwb[];
  agen?: CustomerInfo | null;
  shipper?: CustomerInfo | null;
}

export interface ParseBuildupMawbResponse {
  buildup: BuildupHeader | null;
  details: EksBuildUpDetail[];
  master: MasterWaybill | null;
  host_awbs: HostAwb[];
}
export const EDI_EXPORT_AWB_MAWB = '/edi/export-awb-mawb';
const ediClient = {
  exportBuildUp: (params: DataTableRequest) =>
    apiClient.post<DataTableResponse<BuildupHeader>>(EDI_EXPORT_BUILDUP_ENDPOINT, params),
  exportCWP: (params: DataTableRequest) =>
    apiClient.post<DataTableResponse<WeighingHeader>>(EDI_EXPORT_CWP_ENDPOINT, params),
  parseFhl: (awb: string) => apiClient.get<ParseFhlResponse>(`/edi/parse-fhl/${awb}`),
  parseFwb: (awb: string) => apiClient.get<ParseFwbResponse>(`/edi/parse-fwb/${awb}`),
  exportAwbMawb: (params: DataTableRequest) =>
    apiClient.post<DataTableResponse<MasterWaybill>>(EDI_EXPORT_AWB_MAWB, params),
  parseAwbMawb: (mawb: string) =>
    apiClient.get<ParseAwbMawbResponse>(`/edi/parse-awb-
        mawb/${mawb}`),
  parseBuildupMawb: (buildupNumber: string) =>
    apiClient.get<ParseBuildupMawbResponse>(`/edi/export-buildup-mawb/${buildupNumber}`),
  sendEmailEdi: (param: any) => apiClient.post('/edi/send-email-edi', param),
};

export default ediClient;
