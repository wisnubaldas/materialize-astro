#!/bin/bash
# ============================================
# 🧩 Deployment Script for Development - MAU App
# Author: Wisnu Hidayat
# Date: 2025-10-13
# ============================================

set -e
set -o pipefail

APP_DIR="/home/wisnu/mau-app"
FRONTEND_DIR="$APP_DIR/template-baru"
BACKEND_DIR="$APP_DIR/materialize-fastapi"
BRANCH="development"
LOG_FILE="$APP_DIR/deploy-logs/development-$(date +'%Y%m%d_%H%M%S').log"

mkdir -p "$APP_DIR/deploy-logs"

{
echo "=============================================="
echo "🧩 DEVELOPMENT DEPLOYMENT STARTED: $(date)"
echo "Branch: $BRANCH"
echo "Working directory: $APP_DIR"
echo "=============================================="

# --- Update Repo ---
cd "$APP_DIR"
echo "🔁 Pulling latest changes from $BRANCH..."
git fetch origin
git checkout $BRANCH
git reset --hard origin/$BRANCH
git clean -fd
git pull origin $BRANCH
echo "✅ Git updated successfully."

# --- Build Frontend (Astro) ---
if [ -d "$FRONTEND_DIR" ]; then
  echo "⚙️ Building frontend (Astro)..."
  cd "$FRONTEND_DIR"
  npm ci --legacy-peer-deps
  npm run build
  echo "✅ Frontend build completed."
else
  echo "⚠️ Frontend directory not found: $FRONTEND_DIR"
fi

# --- Restart Backend (Uvicorn/PM2) ---
if [ -d "$BACKEND_DIR" ]; then
  echo "🔁 Restarting backend (Uvicorn or PM2)..."
  cd "$BACKEND_DIR"

  # Jika pakai PM2
  if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "fastapi-dev"; then
      echo "🔁 Restarting existing PM2 process..."
      pm2 restart fastapi-dev
    else
      echo "🚀 Starting FastAPI dev server via PM2..."
      pm2 start "poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" --name fastapi-dev
    fi
    pm2 save
    pm2 list
  else
    echo "⚙️ Running direct uvicorn (fallback)..."
    # Pastikan environment virtualenv aktif
    source .venv/bin/activate
    nohup poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "$APP_DIR/deploy-logs/uvicorn.log" 2>&1 &
    deactivate
  fi

  echo "✅ Backend restarted successfully."
else
  echo "⚠️ Backend directory not found: $BACKEND_DIR"
fi

# --- Restart Frontend (Node server for Astro SSR) ---
if command -v pm2 &> /dev/null; then
  echo "🔁 Restarting Astro SSR server..."
  cd "$FRONTEND_DIR/dist/server"
  if pm2 list | grep -q "astro-dev"; then
    pm2 restart astro-dev
  else
    pm2 start "node ./entry.mjs --host 0.0.0.0 --port 4321" --name astro-dev
  fi
  pm2 save
  echo "✅ Frontend (Astro SSR) restarted."
else
  echo "⚙️ Starting Node server manually..."
  nohup node ./dist/server/entry.mjs --host 0.0.0.0 --port 4321 > "$APP_DIR/deploy-logs/astro.log" 2>&1 &
fi

echo "✅ Development deployment completed successfully."
echo "=============================================="
echo "Completed at: $(date)"
} | tee -a "$LOG_FILE"
