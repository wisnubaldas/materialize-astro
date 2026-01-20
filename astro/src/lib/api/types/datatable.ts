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

export interface DataTableRequest<TFilters = unknown> {
  draw: number;
  start: number;
  length: number;
  search: DataTableSearch;
  order: DataTableOrder[];
  columns: DataTableColumn[];
  filters?: TFilters | null;
}

export interface DataTableResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
}
