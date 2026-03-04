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

exec "$GUNICORN_BIN" app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --workers 1 \
  --threads 2 \
  --timeout 60 \
  --keep-alive 5 \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
