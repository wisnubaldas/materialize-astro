#!/bin/bash
set -euo pipefail

APP_DIR="/home/wisnu/mau-app/materialize-fastapi"
cd "$APP_DIR"
export PYTHONPATH="$APP_DIR"
export PATH="$PATH:/home/wisnu/.local/bin:/usr/local/bin:/usr/bin"

if [ -x "$APP_DIR/.venv/bin/gunicorn" ]; then
  GUNICORN_BIN="$APP_DIR/.venv/bin/gunicorn"
  exec "$GUNICORN_BIN" app.main:app \
    -k uvicorn.workers.UvicornWorker \
    --workers 1 \
    --threads 2 \
    --timeout 60 \
    --keep-alive 5 \
    --bind 0.0.0.0:8000 \
    --access-logfile /var/log/materialize-fastapi/access.log \
    --error-logfile /var/log/materialize-fastapi/error.log
fi

if command -v poetry >/dev/null 2>&1; then
  exec poetry run gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    --workers 1 \
    --threads 2 \
    --timeout 60 \
    --keep-alive 5 \
    --bind 0.0.0.0:8000 \
    --access-logfile /var/log/materialize-fastapi/access.log \
    --error-logfile /var/log/materialize-fastapi/error.log
fi

if command -v gunicorn >/dev/null 2>&1; then
  exec gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    --workers 1 \
    --threads 2 \
    --timeout 60 \
    --keep-alive 5 \
    --bind 0.0.0.0:8000 \
    --access-logfile /var/log/materialize-fastapi/access.log \
    --error-logfile /var/log/materialize-fastapi/error.log
fi

echo "ERROR: gunicorn executable not found (no .venv, no poetry, no system gunicorn)." >&2
exit 1
