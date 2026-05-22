import { apiClient } from './client';

export const WAREHOUSE_BUILD_UP_HEADERS_DATATABLE = '/warehouse/build-up-headers/datatables';

const warehouseClient = {
  getBuildUpHeadersDatatable: (params) => apiClient.post(WAREHOUSE_BUILD_UP_HEADERS_DATATABLE, params),
};

export default warehouseClient;
