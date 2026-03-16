import { apiClient, type SseRequestOptions } from './client';

const textEncoder = new TextEncoder();
const SSE_IV = textEncoder.encode('1234567890123456');

const hexToBytes = (hex: string) => {
  if (!hex || hex.length % 2 !== 0) {
    throw new Error('PUBLIC_SSE_KEY harus berupa string hex genap');
  }
  const view = new Uint8Array(hex.length / 2);
  for (let i = 0; i < view.length; i += 1) {
    view[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return view;
};

const bufferToBase64 = (buffer: ArrayBuffer) => {
  if (typeof btoa !== 'function') {
    throw new Error('Lingkungan ini tidak mendukung base64 encoding');
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const ensureCrypto = () => {
  const cryptoRef = globalThis?.crypto;
  if (!cryptoRef || !cryptoRef.subtle) {
    throw new Error('Browser tidak mendukung Web Crypto API untuk SSE key');
  }
  return cryptoRef;
};

const createSseKey = async (payload: Record<string, unknown> = {}) => {
  const secretHex = import.meta.env.PUBLIC_SSE_KEY;
  if (!secretHex) {
    throw new Error('PUBLIC_SSE_KEY belum terkonfigurasi');
  }
  const secretBytes = hexToBytes(secretHex);
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 30,
  };
  const plainBytes = textEncoder.encode(JSON.stringify(data));
  const cryptoRef = ensureCrypto();
  const cryptoKey = await cryptoRef.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  );
  const encrypted = await cryptoRef.subtle.encrypt(
    { name: 'AES-CBC', iv: SSE_IV },
    cryptoKey,
    plainBytes
  );
  return bufferToBase64(encrypted);
};

const SSE_REQUEST = {
  async getLogApp(options?: SseRequestOptions) {
    const key = await createSseKey({ client: 'hubnet-dashboard' });
    const params = { ...(options?.params ?? {}), key };
    return apiClient.sse('/sse/log-app', {
      ...options,
      params,
    });
  },
  async getAngkasapuraUploadInvoice(options?: SseRequestOptions) {
    const key = await createSseKey({ client: 'angkasapura-upload-invoice' });
    const params = { ...(options?.params ?? {}), key };
    return apiClient.sse('/sse/angkasapura-upload-invoice', {
      ...options,
      params,
    });
  },
};

export default SSE_REQUEST;
