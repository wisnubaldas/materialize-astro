export type QueryParamValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  params?: Record<string, QueryParamValue>;
  raw?: boolean;
  token?: string | null;
  body?: unknown;
}

export interface SseRequestOptions {
  params?: Record<string, QueryParamValue>;
  withCredentials?: boolean;
  signal?: AbortSignal;
}
