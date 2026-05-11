export const APP_TOAST_EVENT = 'toast';
export const APP_TOAST_QUEUE_KEY = '__MAU_APP_TOAST_QUEUE__';
export const APP_TOASTER_READY_KEY = '__MAU_APP_TOASTER_READY__';

export const showToast = (payload) => {
  if (typeof window === 'undefined') {
    return;
  }

  const detail =
    typeof payload === 'string'
      ? { message: payload, type: 'info' }
      : payload && typeof payload === 'object'
        ? payload
        : { message: String(payload ?? ''), type: 'info' };

  if (window[APP_TOASTER_READY_KEY] !== true) {
    const queue = Array.isArray(window[APP_TOAST_QUEUE_KEY]) ? window[APP_TOAST_QUEUE_KEY] : [];
    queue.push(detail);
    window[APP_TOAST_QUEUE_KEY] = queue;
    return;
  }

  window.dispatchEvent(new CustomEvent(APP_TOAST_EVENT, { detail }));
};
