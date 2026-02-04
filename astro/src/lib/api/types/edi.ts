import type {
  DataTableColumn,
  DataTableOrder,
  DataTableRequest as BaseDataTableRequest,
  DataTableResponse as BaseDataTableResponse,
  DataTableSearch,
} from './datatable';

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

export type DataTableRequest = BaseDataTableRequest<DataTableFilters>;
export type DataTableResponse<T> = BaseDataTableResponse<T>;
export type { DataTableColumn, DataTableOrder, DataTableSearch };

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

export interface FwbRecord {
  id: number;
  mawb: string;
  message_type?: string | null;
  message_version?: string | null;
  awb_prefix?: string | null;
  awb_number?: string | null;
  origin?: string | null;
  destination?: string | null;
  shipment_description_code?: string | null;
  total_pieces?: number | null;
  weight_unit?: string | null;
  gross_weight?: number | null;
  routing_list?: string | null;
  first_carrier?: string | null;
  onward_carrier?: string | null;
  flight_number?: string | null;
  flight_carrier?: string | null;
  shipper_name?: string | null;
  shipper_address?: string | null;
  shipper_city?: string | null;
  shipper_state?: string | null;
  shipper_country?: string | null;
  shipper_postcode?: string | null;
  shipper_contact?: string | null;
  consignee_name?: string | null;
  consignee_address?: string | null;
  consignee_city?: string | null;
  consignee_state?: string | null;
  consignee_country?: string | null;
  consignee_postcode?: string | null;
  consignee_contact?: string | null;
  agent_iata_code?: string | null;
  agent_account?: string | null;
  agent_name?: string | null;
  agent_city?: string | null;
  currency?: string | null;
  charge_code?: string | null;
  weight_charge_pp_cc?: string | null;
  other_charge_pp_cc?: string | null;
  declared_value_carriage?: string | null;
  declared_value_customs?: string | null;
  insurance_value?: string | null;
  rate_line_no?: string | null;
  pieces?: number | null;
  weight?: number | null;
  rate_class?: string | null;
  chargeable_weight?: number | null;
  rate?: number | null;
  total_charge?: number | null;
  goods_description?: string | null;
  dimensions?: string | null;
  volume?: number | null;
  slac?: string | null;
  hs_code?: string | null;
  country_of_origin?: string | null;
  other_charge_code?: string | null;
  entitlement?: string | null;
  amount?: number | null;
  prepaid_weight_charge?: number | null;
  prepaid_other_charge?: number | null;
  total_prepaid?: number | null;
  collect_charge?: number | null;
  shipper_certification?: string | null;
  issue_date?: string | null;
  issue_place?: string | null;
  issued_by?: string | null;
  special_handling_code?: string | null;
  ssr?: string | null;
  osi?: string | null;
  oci?: string | null;
  created_at?: string | null;
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

export interface ImpMasterWaybill {
  MasterAWB: string;
  Pieces?: number | null;
  Weight?: number | null;
  Volume?: number | null;
  AirlinesCode?: string | null;
  FlightNo?: string | null;
  Origin?: string | null;
  Destination?: string | null;
  DateOfFight?: string | null;
  KindOfGood?: string | null;
  KindOfCode?: string | null;
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
  void?: boolean | number | null;
  token?: string | null;
  created_at?: string | null;
}

export interface ImpHostAwb {
  noid: number;
  MasterAWB?: string | null;
  HostAWB?: string | null;
  AgenCode?: string | null;
  shippername?: string | null;
  Consigneename?: string | null;
  RCF?: boolean | number | null;
  TFD?: boolean | number | null;
  DLV?: boolean | number | null;
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
