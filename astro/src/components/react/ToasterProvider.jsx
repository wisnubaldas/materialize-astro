import '@libs/animate-css/animate.scss';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { APP_TOAST_EVENT, APP_TOAST_QUEUE_KEY, APP_TOASTER_READY_KEY } from '@utils/toast.js';

const ToastContext = createContext();

const TYPE_ALIAS = {
  error: 'danger',
};

const TYPE_META = {
  success: { title: 'Sukses', icon: 'ri-check-line' },
  danger: { title: 'Error', icon: 'ri-error-warning-line' },
  warning: { title: 'Peringatan', icon: 'ri-alert-line' },
  info: { title: 'Informasi', icon: 'ri-information-line' },
  primary: { title: 'Informasi', icon: 'ri-notification-3-line' },
  secondary: { title: 'Informasi', icon: 'ri-notification-3-line' },
};

const normalizeType = (value) => {
  const token = String(value ?? 'info').toLowerCase().trim();
  const mapped = TYPE_ALIAS[token] || token;
  if (TYPE_META[mapped]) return mapped;
  return 'info';
};

const normalizeToastPayload = (payload) => {
  if (typeof payload === 'string') {
    return {
      message: payload,
      type: 'info',
      duration: 4000,
      title: TYPE_META.info.title,
      persist: false,
    };
  }

  const source = payload && typeof payload === 'object' ? payload : {};
  const type = normalizeType(source.type);
  const duration = Number(source.duration);
  const persist = source.persist === true;
  const message = String(source.message ?? '').trim();

  return {
    message,
    type,
    duration: Number.isFinite(duration) ? duration : 4000,
    title: String(source.title ?? TYPE_META[type].title).trim(),
    persist,
  };
};

export const useToast = () => useContext(ToastContext);

export function ToasterProvider({ children = null } = {}) {
  const [toasts, setToasts] = useState([]);
  const [portalTarget, setPortalTarget] = useState(null);
  const timersRef = useRef(new Map());

  const removeToast = (id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const addToast = (payloadOrMessage, type, duration, title, persist) => {
    const payload =
      typeof payloadOrMessage === 'string'
        ? { message: payloadOrMessage, type, duration, title, persist }
        : payloadOrMessage;
    const toast = normalizeToastPayload(payload);
    if (!toast.message) {
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [
      ...prev,
      {
        id,
        message: toast.message,
        type: toast.type,
        title: toast.title,
      },
    ]);

    if (!toast.persist && toast.duration > 0) {
      const timer = window.setTimeout(() => {
        removeToast(id);
      }, toast.duration);
      timersRef.current.set(id, timer);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    setPortalTarget(document.body);
    window[APP_TOASTER_READY_KEY] = true;

    const pendingQueue = Array.isArray(window[APP_TOAST_QUEUE_KEY]) ? window[APP_TOAST_QUEUE_KEY] : [];
    if (pendingQueue.length) {
      pendingQueue.forEach((payload) => addToast(payload));
      window[APP_TOAST_QUEUE_KEY] = [];
    }

    const handleGlobalToast = (event) => {
      addToast(event?.detail);
    };

    window.addEventListener(APP_TOAST_EVENT, handleGlobalToast);
    return () => {
      window.removeEventListener(APP_TOAST_EVENT, handleGlobalToast);
      window[APP_TOASTER_READY_KEY] = false;
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const viewport = (
    <div className="toast-container app-toast-viewport position-fixed top-0 end-0 p-3 p-sm-4" style={{ zIndex: 2000 }}>
      {toasts.map((toast) => {
        const meta = TYPE_META[toast.type] || TYPE_META.info;
        return (
          <div
            key={toast.id}
            className="bs-toast toast fade show animate__animated animate__fadeInRight mb-2"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className={`toast-header bg-label-${toast.type}`}>
              <i className={`icon-base ri ${meta.icon} text-${toast.type} me-2`} aria-hidden="true"></i>
              <div className="me-auto fw-medium">{toast.title}</div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => removeToast(toast.id)}
              ></button>
            </div>
            <div className={`toast-body text-${toast.type}`} style={{ whiteSpace: 'pre-wrap' }}>
              {toast.message}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {portalTarget ? createPortal(viewport, portalTarget) : null}
    </ToastContext.Provider>
  );
}
