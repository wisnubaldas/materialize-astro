#!/bin/bash
set -euo pipefail

APP_DIR="/home/wisnu/mau-app/materialize-fastapi"
cd "$APP_DIR"
export PYTHONPATH="$APP_DIR"
export PATH="$PATH:/home/wisnu/.local/bin:/usr/local/bin:/usr/bin"

GUNICORN_BIN="$APP_DIR/.venv/bin/gunicorn"
if [ ! -x "$GUNICORN_BIN" ]; then
  echo "ERROR: $GUNICORN_BIN tidak ditemukan atau tidak executable." >&2
  ls -la "$APP_DIR/.venv/bin" >&2 || true
  exit 1
fi

HOST="${GUNICORN_HOST:-127.0.0.1}"
PORT="${GUNICORN_PORT:-8000}"
TIMEOUT="${GUNICORN_TIMEOUT:-120}"
GRACEFUL_TIMEOUT="${GUNICORN_GRACEFUL_TIMEOUT:-30}"
KEEP_ALIVE="${GUNICORN_KEEP_ALIVE:-15}"
MAX_REQUESTS="${GUNICORN_MAX_REQUESTS:-1000}"
MAX_REQUESTS_JITTER="${GUNICORN_MAX_REQUESTS_JITTER:-100}"
LOG_LEVEL="${GUNICORN_LOG_LEVEL:-info}"

if [ -n "${GUNICORN_WORKERS:-}" ]; then
  WORKERS="${GUNICORN_WORKERS}"
else
  CPU_COUNT="$(nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null || echo 2)"
  case "$CPU_COUNT" in
    ''|*[!0-9]*)
      CPU_COUNT=2
      ;;
  esac

  if [ "$CPU_COUNT" -le 2 ]; then
    WORKERS=2
  else
    WORKERS="$CPU_COUNT"
  fi

  if [ "$WORKERS" -gt 4 ]; then
    WORKERS=4
  fi
fi

exec "$GUNICORN_BIN" app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind "${HOST}:${PORT}" \
  --workers "${WORKERS}" \
  --timeout "${TIMEOUT}" \
  --graceful-timeout "${GRACEFUL_TIMEOUT}" \
  --keep-alive "${KEEP_ALIVE}" \
  --max-requests "${MAX_REQUESTS}" \
  --max-requests-jitter "${MAX_REQUESTS_JITTER}" \
  --log-level "${LOG_LEVEL}" \
  --access-logfile - \
  --error-logfile -
