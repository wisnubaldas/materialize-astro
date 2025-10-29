import React, { createContext, useContext, useState, useEffect } from 'react';
import '@libs/animate-css/animate.scss';

// 🔹 Context untuk React-komponen
const ToastContext = createContext();

// Hook React (opsional, hanya dipakai kalau kamu di dalam island yang sama)
export const useToast = () => useContext(ToastContext);

export function ToasterProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // 🔹 Fungsi utama untuk menambahkan toast
  const addToast = (message, type = 'info', duration = 5000, title) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // 🔹 Hapus manual (kalau klik tombol X)
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 🔹 Dengarkan event global dari luar React
  useEffect(() => {
    const handleGlobalToast = (e) => {
      const { message, type = 'info', duration = 5000, title } = e.detail || {};
      addToast(message, type, duration, title);
    };
    window.addEventListener('toast', handleGlobalToast);
    return () => window.removeEventListener('toast', handleGlobalToast);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      <div className="toast-container position-absolute top-0 end-0" style={{ zIndex: 1080 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bs-toast toast fade show animate__animated animate__flipInX mb-2"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="toast-header">
              <i className={`icon-base ri ri-spam-fill text-${t.type} me-2`}></i>
              <div className="me-auto fw-medium">{t.title}</div>
              <small className="text-body-secondary">{Date.now()}</small>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="toast"
                aria-label="Close"
                onClick={() => removeToast(t.id)}
              ></button>
            </div>
            <div className={`toast-body text-${t.type}`}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
