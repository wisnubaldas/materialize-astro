import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { angkasapuraApi } from '@lib/api/angkasapuraApi';
import SSE_REQUEST from '@lib/api/sse';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const DEFAULT_MESSAGE = 'Unggah file Excel invoice CTOS untuk dikirim ke API SIGO';
const ACTIVE_UPLOAD_STATUSES = new Set(['queued', 'processing']);
const STATUS_POLLING_INTERVAL_MS = 5000;

const createDefaultJobStatus = () => ({
  job_id: null,
  filename: null,
  status: 'idle',
  progress: 0,
  message: '',
  started_at: null,
  finished_at: null,
  result: null,
  error: null,
  can_upload: true,
});

const parseUploadError = (error) => {
  const fallback = {
    message: 'Gagal mengunggah file. Silakan coba kembali.',
    jobStatus: null,
  };
  const rawMessage = error instanceof Error ? error.message : fallback.message;
  if (!rawMessage) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawMessage);
    const detail = parsed?.detail;
    if (detail && typeof detail === 'object') {
      return {
        message: detail?.message || parsed?.message || fallback.message,
        jobStatus:
          detail?.job_status && typeof detail.job_status === 'object' ? detail.job_status : null,
      };
    }
    if (typeof detail === 'string') {
      return { message: detail, jobStatus: null };
    }
    if (typeof parsed?.message === 'string') {
      return { message: parsed.message, jobStatus: null };
    }
  } catch (parseError) {
    // fallback ke raw message
  }

  return { message: rawMessage, jobStatus: null };
};

const summarizeResultFeedback = (result, fallbackMessage) => {
  const inserted = Number(result?.inserted ?? 0);
  const sourceNotFoundCount = Array.isArray(result?.source_not_found_invoices)
    ? result.source_not_found_invoices.length
    : 0;
  const message =
    result?.message ||
    fallbackMessage ||
    `Selesai. Inserted: ${inserted}, Source not found: ${sourceNotFoundCount}.`;

  if (inserted > 0 && sourceNotFoundCount === 0) {
    return { variant: 'success', message };
  }
  if (inserted > 0 || sourceNotFoundCount > 0) {
    return { variant: 'warning', message };
  }
  return { variant: 'danger', message };
};

export function useUploadInvoiceExcelLogic() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isStartingUpload, setIsStartingUpload] = useState(false);
  const [feedback, setFeedback] = useState(() => ({
    variant: 'info',
    message: DEFAULT_MESSAGE,
  }));
  const [dropError, setDropError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [inputKey, setInputKey] = useState(0);
  const [jobStatus, setJobStatus] = useState(() => createDefaultJobStatus());
  const [sseError, setSseError] = useState('');
  const [isSseFallbackActive, setIsSseFallbackActive] = useState(false);
  const [isSseConnected, setIsSseConnected] = useState(false);

  const eventSourceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const pollingInFlightRef = useRef(false);
  const retryAttemptRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const applyJobStatus = useCallback((incomingStatus) => {
    if (!incomingStatus || typeof incomingStatus !== 'object') {
      return;
    }

    setJobStatus(incomingStatus);
    const status = String(incomingStatus.status || 'idle');
    const message = incomingStatus.message || DEFAULT_MESSAGE;

    if (incomingStatus.result && typeof incomingStatus.result === 'object') {
      setUploadResult(incomingStatus.result);
    }

    if (status === 'completed') {
      setFeedback(summarizeResultFeedback(incomingStatus.result, message));
      setSelectedFile(null);
      setInputKey((prev) => prev + 1);
      return;
    }

    if (status === 'failed') {
      setFeedback({
        variant: 'danger',
        message: incomingStatus.error || message || 'Proses upload invoice gagal.',
      });
      return;
    }

    if (ACTIVE_UPLOAD_STATUSES.has(status)) {
      setFeedback({
        variant: 'warning',
        message: message || 'Proses upload invoice sedang berjalan.',
      });
    }
  }, []);

  const loadCurrentStatus = useCallback(async () => {
    const status = await angkasapuraApi.getUploadInvoiceExcelStatus();
    applyJobStatus(status);
  }, [applyJobStatus]);

  useEffect(() => {
    let isCanceled = false;
    loadCurrentStatus().catch((error) => {
      if (!isCanceled) {
        setSseError(
          error instanceof Error
            ? `Gagal memuat status upload: ${error.message}`
            : 'Gagal memuat status upload invoice.'
        );
      }
    });
    return () => {
      isCanceled = true;
    };
  }, [loadCurrentStatus]);

  useEffect(() => {
    isUnmountedRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const clearPollingTimer = () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      pollingInFlightRef.current = false;
    };

    const cleanupConnection = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (isUnmountedRef.current) {
        return;
      }

      clearReconnectTimer();
      cleanupConnection();
      const nextAttempt = retryAttemptRef.current + 1;
      retryAttemptRef.current = nextAttempt;
      const delay = Math.min(1000 * 2 ** Math.min(nextAttempt - 1, 3), 30000);
      reconnectTimerRef.current = window.setTimeout(() => {
        if (!isUnmountedRef.current) {
          connect();
        }
      }, delay);
    };

    const handleMessage = (event, abortSignal) => {
      if (abortSignal.aborted || isUnmountedRef.current) {
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        applyJobStatus(payload);
        retryAttemptRef.current = 0;
        setSseError('');
      } catch (parseError) {
        console.error('Gagal parse payload SSE upload invoice', parseError);
      }
    };

    const handleError = (event, abortSignal) => {
      if (abortSignal.aborted || isUnmountedRef.current) {
        return;
      }
      console.error('SSE upload invoice error', event);
      setSseError('SSE status upload terputus. Mencoba terhubung ulang...');
      setIsSseConnected(false);
      setIsSseFallbackActive(true);
      scheduleReconnect();
    };

    async function connect() {
      clearReconnectTimer();
      cleanupConnection();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const eventSource = await SSE_REQUEST.getAngkasapuraUploadInvoice({
          signal: abortController.signal,
        });
        if (abortController.signal.aborted || isUnmountedRef.current) {
          eventSource.close();
          return;
        }

        eventSourceRef.current = eventSource;
        retryAttemptRef.current = 0;
        eventSource.onopen = () => {
          if (abortController.signal.aborted || isUnmountedRef.current) {
            return;
          }
          setIsSseConnected(true);
          setIsSseFallbackActive(false);
          setSseError('');
        };
        eventSource.onmessage = (event) => handleMessage(event, abortController.signal);
        eventSource.onerror = (event) => handleError(event, abortController.signal);
      } catch (error) {
        if (abortController.signal.aborted || isUnmountedRef.current) {
          return;
        }
        setIsSseConnected(false);
        setIsSseFallbackActive(true);
        setSseError(
          error instanceof Error ? error.message : 'Tidak bisa membuka SSE status upload invoice.'
        );
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      isUnmountedRef.current = true;
      clearReconnectTimer();
      clearPollingTimer();
      cleanupConnection();
    };
  }, [applyJobStatus]);

  useEffect(() => {
    if (!isSseFallbackActive) {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      pollingInFlightRef.current = false;
      return undefined;
    }

    const pollJobStatus = async () => {
      if (pollingInFlightRef.current) {
        return;
      }
      pollingInFlightRef.current = true;
      try {
        await loadCurrentStatus();
      } catch (error) {
        if (!isUnmountedRef.current) {
          setSseError(
            error instanceof Error
              ? `SSE belum tersambung. Polling status gagal: ${error.message}`
              : 'SSE belum tersambung. Polling status gagal.'
          );
        }
      } finally {
        pollingInFlightRef.current = false;
      }
    };

    pollJobStatus();
    pollingTimerRef.current = window.setInterval(pollJobStatus, STATUS_POLLING_INTERVAL_MS);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      pollingInFlightRef.current = false;
    };
  }, [isSseFallbackActive, loadCurrentStatus]);

  const isJobRunning = ACTIVE_UPLOAD_STATUSES.has(String(jobStatus?.status || 'idle'));

  const handleUpload = useCallback(
    async (file) => {
      if (isJobRunning) {
        setFeedback({
          variant: 'warning',
          message: 'Proses upload sebelumnya masih berjalan. Mohon tunggu sampai selesai.',
        });
        return;
      }

      setIsStartingUpload(true);
      setDropError(null);
      setUploadResult(null);
      setFeedback({ variant: 'info', message: 'Mengirim file upload untuk diproses...' });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await angkasapuraApi.uploadInvoiceExcel(formData);
        applyJobStatus(response);
      } catch (error) {
        const parsedError = parseUploadError(error);
        if (parsedError.jobStatus) {
          applyJobStatus(parsedError.jobStatus);
        }

        const isRunning = ACTIVE_UPLOAD_STATUSES.has(String(parsedError?.jobStatus?.status || ''));
        setFeedback({
          variant: isRunning ? 'warning' : 'danger',
          message: parsedError.message,
        });
      } finally {
        setIsStartingUpload(false);
      }
    },
    [applyJobStatus, isJobRunning]
  );

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles.length) {
        return;
      }
      const [file] = acceptedFiles;
      setSelectedFile(file);
      handleUpload(file);
    },
    [handleUpload]
  );

  const onDropRejected = useCallback((rejections) => {
    if (!rejections.length) {
      return;
    }

    const messages = [];
    rejections.forEach((rejection) => {
      rejection.errors.forEach((err) => {
        if (err?.message) {
          messages.push(err.message);
        }
      });
    });

    const message = messages.join(', ') || 'File tidak valid.';
    setDropError(message);
    setFeedback({ variant: 'danger', message });
    setSelectedFile(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: false,
    disabled: isStartingUpload || isJobRunning,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
    },
    maxSize: MAX_UPLOAD_SIZE,
  });

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return '';
    }

    const sizeInKB = selectedFile.size / 1024;
    const formattedSize =
      sizeInKB >= 1024 ? `${(sizeInKB / 1024).toFixed(2)} MB` : `${sizeInKB.toFixed(2)} KB`;

    return `${selectedFile.name} - ${formattedSize}`;
  }, [selectedFile]);

  const progress = Math.max(0, Math.min(100, Number(jobStatus?.progress ?? 0)));

  const feedbackClass =
    feedback.variant === 'success'
      ? 'success'
      : feedback.variant === 'warning'
        ? 'warning'
        : feedback.variant === 'danger'
          ? 'danger'
          : 'primary';

  const dropzoneClassName = `dropzone needsclick${isDragActive ? ' dz-drag-hover' : ''}`;
  const sourceNotFoundInvoices = Array.isArray(uploadResult?.source_not_found_invoices)
    ? uploadResult.source_not_found_invoices
    : [];
  const uploadErrors = Array.isArray(uploadResult?.errors) ? uploadResult.errors : [];

  return {
    inputKey,
    isStartingUpload,
    feedback,
    feedbackClass,
    dropError,
    uploadResult,
    jobStatus,
    sseError,
    isSseFallbackActive,
    isSseConnected,
    isJobRunning,
    dropzoneClassName,
    selectedFileSummary,
    progress,
    sourceNotFoundInvoices,
    uploadErrors,
    statusPollingIntervalSeconds: STATUS_POLLING_INTERVAL_MS / 1000,
    getRootProps,
    getInputProps,
    isDragActive,
  };
}
