import { apiClient } from './client';
import type {
  BuildupHeader,
  DataTableRequest,
  DataTableResponse,
  DiscrepancyCode,
  DiscrepancyCodeCreatePayload,
  DiscrepancyCodeFilters,
  DiscrepancyCodeUpdatePayload,
  FsuMessage,
  FsuMessageCreatePayload,
  FsuMessageFilters,
  FsuMessageUpdatePayload,
  ImpHostAwb,
  MasterWaybill,
  ParseAwbMawbResponse,
  ParseBuildupMawbResponse,
  ParseFhlResponse,
  FwbRecord,
  ParseFwbResponse,
  WeighingHeader,
} from './types/edi';

export const EDI_EXPORT_BUILDUP_ENDPOINT = '/edi/export-buildup';
export const EDI_EXPORT_CWP_ENDPOINT = '/edi/export-cwp';
export const EDI_EXPORT_AWB_MAWB = '/edi/export-awb-mawb';
export const EDI_IMPORT_MASTERWAYBILL_ENDPOINT = '/edi/import-masterwaybill';
export const EDI_DISCREPANCY_CODE_DATATABLE_ENDPOINT = '/edi/discrepancy-codes/datatables';
export const EDI_DISCREPANCY_CODE_ENDPOINT = '/edi/discrepancy-codes';
export const EDI_FSU_MESSAGE_DATATABLE_ENDPOINT = '/edi/fsu-messages/datatables';
export const EDI_FSU_MESSAGE_ENDPOINT = '/edi/fsu-messages';

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
  getFwbByMawb: (mawb: string) => apiClient.get<FwbRecord>(`/edi/fwb/${mawb}`),
  sendEmailEdi: (param: any) => apiClient.post('/edi/send-email-edi', param),
  sendEmailFwb: (param: any) => apiClient.post('/edi/send-email-fwb', param),
  listDiscrepancyCodes: () => apiClient.get<DiscrepancyCode[]>(EDI_DISCREPANCY_CODE_ENDPOINT),
  getDiscrepancyCode: (id: number | string) =>
    apiClient.get<DiscrepancyCode>(`${EDI_DISCREPANCY_CODE_ENDPOINT}/${id}`),
  createDiscrepancyCode: (payload: DiscrepancyCodeCreatePayload) =>
    apiClient.post<DiscrepancyCode>(EDI_DISCREPANCY_CODE_ENDPOINT, payload),
  updateDiscrepancyCode: (id: number | string, payload: DiscrepancyCodeUpdatePayload) =>
    apiClient.put<DiscrepancyCode>(`${EDI_DISCREPANCY_CODE_ENDPOINT}/${id}`, payload),
  deleteDiscrepancyCode: (id: number | string) =>
    apiClient.delete(`${EDI_DISCREPANCY_CODE_ENDPOINT}/${id}`),
  listFsuMessages: () => apiClient.get<FsuMessage[]>(EDI_FSU_MESSAGE_ENDPOINT),
  getFsuMessage: (id: number | string) =>
    apiClient.get<FsuMessage>(`${EDI_FSU_MESSAGE_ENDPOINT}/${id}`),
  createFsuMessage: (payload: FsuMessageCreatePayload) =>
    apiClient.post<FsuMessage>(EDI_FSU_MESSAGE_ENDPOINT, payload),
  updateFsuMessage: (id: number | string, payload: FsuMessageUpdatePayload) =>
    apiClient.put<FsuMessage>(`${EDI_FSU_MESSAGE_ENDPOINT}/${id}`, payload),
  deleteFsuMessage: (id: number | string) =>
    apiClient.delete(`${EDI_FSU_MESSAGE_ENDPOINT}/${id}`),
};

export default ediClient;
export type {
  BuildupHeader,
  CustomerInfo,
  DiscrepancyCode,
  DiscrepancyCodeCreatePayload,
  DiscrepancyCodeFilters,
  DiscrepancyCodeUpdatePayload,
  DataTableColumn,
  FsuMessage,
  FsuMessageCreatePayload,
  FsuMessageFilters,
  FsuMessageUpdatePayload,
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
  FwbRecord,
  ParseFwbResponse,
  WeighingDetail,
  WeighingHeader,
} from './types/edi';
