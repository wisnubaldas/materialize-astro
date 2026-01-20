import { apiClient } from './client';
import type {
  BuildupHeader,
  DataTableRequest,
  DataTableResponse,
  ImpHostAwb,
  MasterWaybill,
  ParseAwbMawbResponse,
  ParseBuildupMawbResponse,
  ParseFhlResponse,
  ParseFwbResponse,
  WeighingHeader,
} from './types/edi';

export const EDI_EXPORT_BUILDUP_ENDPOINT = '/edi/export-buildup';
export const EDI_EXPORT_CWP_ENDPOINT = '/edi/export-cwp';
export const EDI_EXPORT_AWB_MAWB = '/edi/export-awb-mawb';
export const EDI_IMPORT_MASTERWAYBILL_ENDPOINT = '/edi/import-masterwaybill';

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
    apiClient.get<ParseAwbMawbResponse>(`/edi/parse-awb-mawb/${mawb}`),
  parseBuildupMawb: (buildupNumber: string) =>
    apiClient.get<ParseBuildupMawbResponse>(`/edi/export-buildup-mawb/${buildupNumber}`),
  getImportMasterwaybill: (mawb: string) =>
    apiClient.get<ImpHostAwb[]>(`${EDI_IMPORT_MASTERWAYBILL_ENDPOINT}/${mawb}`),
  sendEmailEdi: (param: any) => apiClient.post('/edi/send-email-edi', param),
};

export default ediClient;
export type {
  BuildupHeader,
  CustomerInfo,
  DataTableColumn,
  DataTableFilters,
  DataTableOrder,
  DataTableRequest,
  DataTableResponse,
  DataTableSearch,
  EksBuildUpDetail,
  HostAwb,
  ImpHostAwb,
  ImpMasterWaybill,
  MasterWaybill,
  ParseAwbMawbResponse,
  ParseBuildupMawbResponse,
  ParseFhlResponse,
  ParseFwbResponse,
  WeighingDetail,
  WeighingHeader,
} from './types/edi';
