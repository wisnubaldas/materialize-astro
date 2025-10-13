#!/bin/bash
cd /home/wisnu/mau-app/materialize-fastapi
export PYTHONPATH=/home/wisnu/mau-app/materialize-fastapi
source .venv/bin/activate

exec gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --workers 1 \
  --threads 2 \
  --timeout 60 \
  --keep-alive 5 \
  --bind 0.0.0.0:8000 \
  --access-logfile /var/log/materialize-fastapi/access.log \
  --error-logfile /var/log/materialize-fastapi/error.log