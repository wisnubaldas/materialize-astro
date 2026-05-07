import { useMemo } from 'react';
import { showToast } from '@utils/toast.js';

export const useGlobalToast = () =>
  useMemo(
    () => ({
      success: (message) => showToast({ message, type: 'success' }),
      error: (message) => showToast({ message, type: 'danger' }),
      info: (message) => showToast({ message, type: 'info' }),
    }),
    []
  );
