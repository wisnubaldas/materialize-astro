import SSE_REQUEST from '@lib/api/sse';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { resolveErrorMessage } from './shared';
import CardPages from '../ui/CardPages.jsx';

const isBrowser = () => typeof window !== 'undefined';

export default function SseDataTracking() {
  const [logStreamError, setLogStreamError] = useState('');
  const [logAppEntries, setLogAppEntries] = useState([]);
  const eventSourceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const retryAttemptRef = useRef(0);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
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
      if (!isBrowser()) {
        return;
      }
      clearReconnectTimer();
      cleanupConnection();
      const nextAttempt = retryAttemptRef.current + 1;
      retryAttemptRef.current = nextAttempt;
      const delay = Math.min(1000 * 2 ** Math.min(nextAttempt - 1, 3), 60000);
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
        if (Array.isArray(payload)) {
          setLogAppEntries(payload);
        } else if (payload) {
          setLogAppEntries((prev) => [...prev.slice(-9), payload]);
        }
        retryAttemptRef.current = 0;
        setLogStreamError('');
      } catch (parseError) {
        console.error('Gagal parse payload SSE log-app', parseError);
      }
    };

    const handleError = (event, abortSignal) => {
      if (abortSignal.aborted || isUnmountedRef.current) {
        return;
      }
      console.error('SSE log-app error', event);
      setLogStreamError('SSE log aplikasi terputus. Mencoba terhubung ulang...');
      scheduleReconnect();
    };

    async function connect() {
      clearReconnectTimer();
      cleanupConnection();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const eventSource = await SSE_REQUEST.getLogApp({ signal: abortController.signal });
        if (abortController.signal.aborted || isUnmountedRef.current) {
          eventSource.close();
          return;
        }
        eventSourceRef.current = eventSource;
        retryAttemptRef.current = 0;

        eventSource.onmessage = (event) => handleMessage(event, abortController.signal);
        eventSource.onerror = (event) => handleError(event, abortController.signal);
      } catch (error) {
        if (abortController.signal.aborted || isUnmountedRef.current) {
          return;
        }
        console.error('Tidak bisa membuka SSE log-app', error);
        setLogStreamError(resolveErrorMessage(error, 'Gagal membuka SSE log aplikasi.'));
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      isUnmountedRef.current = true;
      clearReconnectTimer();
      cleanupConnection();
    };
  }, []);

  const entriesToRender = logAppEntries;
  const orderedLogEntries =
    entriesToRender.length > 0 ? [...entriesToRender].reverse() : [...logAppEntries].reverse();

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
      case 'ERR':
        return '#e53935'; // merah
      case 'WARN':
      case 'WARNING':
        return '#ffb300'; // oranye
      case 'DEBUG':
        return '#29b6f6'; // biru muda
      case 'INFO':
      default:
        return '#4caf50'; // hijau
    }
  };

  const renderLogLines = () => {
    if (logStreamError) {
      return (
        <div className="log-line">
          <span style={{ color: '#ff5252' }}>[ERROR]</span> {logStreamError}
        </div>
      );
    }

    if (orderedLogEntries.length === 0) {
      return (
        <div className="log-line">
          <span style={{ color: '#fdd835' }}>[WAIT]</span> Menunggu log aplikasi melalui SSE...
        </div>
      );
    }

    return orderedLogEntries.map((entry, index) => {
      const timestamp = entry?.['@timestamp']
        ? dayjs(entry['@timestamp']).format('YYYY-MM-DD HH:mm:ss')
        : '0000-00-00 00:00:00';
      const level = (entry?.['log.level'] ?? 'INFO').toUpperCase();
      const levelColor = getLevelColor(level);
      const fnName = entry?.['log.origin.function'] ?? 'unknown';
      const fileName = entry?.['log.origin.file.name'] ?? 'unknown';
      const message = entry?.message ?? 'Log tidak memiliki pesan';

      return (
        <div key={entry?.['@timestamp'] ?? `log-${index}`} className="log-line">
          <span style={{ color: '#fdd835' }}>[{timestamp}]</span>{' '}
          <span style={{ color: levelColor }}>[{level}]</span>{' '}
          <span style={{ color: '#90caf9' }}>
            {fnName} ({fileName})
          </span>{' '}
          <span style={{ color: '#e0e0e0' }}>:: {message}</span>
          {level === 'ERROR' && entry?.['error.message'] ? (
            <p>
              <span style={{ color: '#c20c0f' }}>{entry?.['error.message']} </span>
            </p>
          ) : (
            ''
          )}
        </div>
      );
    });
  };

  return (
    <div className="card shadow-sm border-0 overflow-hidden">
      <CardPages
        title="Logging & Tracking"
        description="Pantau log aktivitas backend server secara realtime"
        icon="ri ri-terminal-window-line"
      />
      <div className="card-body p-4">
        <div
          className="alert alert-secondary py-3 px-3 mb-0"
          style={{
            fontFamily: 'Ubuntu Mono, Consolas, Menlo, Monaco, "Courier New", monospace',
            backgroundColor: 'oklch(20.8% 0.042 265.755)',
            color: '#e0e0e0',
          }}
        >
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>{renderLogLines()}</div>
        </div>
      </div>
    </div>
  );
}
