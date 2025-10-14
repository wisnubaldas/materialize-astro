#!/bin/bash
# ============================================
# 🚀 Deployment Script for Development - MAU App
# Author: Wisnu Hidayat
# ============================================

set -e
set -o pipefail

# Ensure PATH so poetry/npm/node are discoverable (match production)
export PATH="$PATH:/home/wisnu/.local/bin:/usr/local/bin:/usr/bin"

APP_DIR="/home/wisnu/mau-app"
FRONTEND_DIR="$APP_DIR/template-baru"
BACKEND_DIR="$APP_DIR/materialize-fastapi"
BRANCH="master"
LOG_FILE="$APP_DIR/deploy-logs/development-$(date +'%Y%m%d_%H%M%S').log"

mkdir -p "$APP_DIR/deploy-logs"

# Simple failure trap for clear feedback in logs
trap 'echo "❌ Deployment failed at $(date). See log: $LOG_FILE"' ERR

{
echo "=============================================="
echo "🛠️  DEVELOPMENT DEPLOYMENT STARTED: $(date)"
echo "Branch: $BRANCH"
echo "Working directory: $APP_DIR"
echo "=============================================="

# --- Update repository (align with production) ---
cd "$APP_DIR"
echo "📥 Pulling latest changes from $BRANCH..."
git fetch origin
git checkout $BRANCH
git reset --hard origin/$BRANCH
git clean -fd
git pull origin $BRANCH
echo "✅ Git updated successfully."

# --- Build Frontend (Astro) ---
if [ -d "$FRONTEND_DIR" ]; then
  echo "🔧 Building frontend (Astro)..."
  cd "$FRONTEND_DIR"
  npm install --legacy-peer-deps
  npm run build
  echo "✅ Frontend build completed."
else
  echo "⚠️  Frontend directory not found: $FRONTEND_DIR"
fi

# --- Backend dependencies (poetry) ---
if [ -d "$BACKEND_DIR" ]; then
  echo "📦 Installing backend dependencies (poetry)..."
  cd "$BACKEND_DIR"
  if command -v poetry &> /dev/null; then
    poetry install
  elif [ -x "/home/wisnu/.local/bin/poetry" ]; then
    /home/wisnu/.local/bin/poetry install
  elif [ -x "/usr/local/bin/poetry" ]; then
    /usr/local/bin/poetry install
  else
    echo "❌ Poetry not found. Please install poetry for development."
    exit 1
  fi
  echo "✅ Backend dependencies installed."
else
  echo "⚠️  Backend directory not found: $BACKEND_DIR"
fi

# --- Restart Backend (Uvicorn via PM2 or fallback) ---
if [ -d "$BACKEND_DIR" ]; then
  echo "🔁 Restarting backend (Uvicorn)..."
  cd "$BACKEND_DIR"
  if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "fastapi-dev"; then
      echo "↻ Restarting existing PM2 process: fastapi-dev"
      pm2 restart fastapi-dev
    else
      echo "▶️  Starting FastAPI dev server via PM2..."
      pm2 start "poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" --name fastapi-dev
    fi
    pm2 save
  else
    echo "▶️  Running direct uvicorn (nohup fallback)..."
    nohup poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "$APP_DIR/deploy-logs/uvicorn.log" 2>&1 &
  fi
  echo "✅ Backend is running."
fi

# --- Restart Frontend SSR (Astro via PM2 or fallback) ---
SSR_ENTRY="$FRONTEND_DIR/dist/server/entry.mjs"
if [ -f "$SSR_ENTRY" ]; then
  if command -v pm2 &> /dev/null; then
    echo "🔁 Restarting Astro SSR (PM2)..."
    if pm2 list | grep -q "astro-dev"; then
      pm2 restart astro-dev
    else
    #   pm2 start "node $SSR_ENTRY --host 0.0.0.0 --port 4321" --name astro-dev
      pm2 start "npm run preview" --name astro-dev
    fi
    pm2 save
    echo "✅ Frontend SSR is running (PM2)."
  else
    echo "▶️  Starting Astro SSR (nohup fallback)..."
    nohup node "$SSR_ENTRY" --host 0.0.0.0 --port 4321 > "$APP_DIR/deploy-logs/astro.log" 2>&1 &
    echo "✅ Frontend SSR started (nohup)."
  fi
else
  echo "⚠️  SSR entry not found: $SSR_ENTRY (did the build succeed?)"
fi

chmod 775 /home/wisnu/mau-app/materialize-fastapi/run-prod.sh

echo "🎉 Development deployment completed successfully."
echo "=============================================="
echo "Completed at: $(date)"
} | tee -a "$LOG_FILE"

