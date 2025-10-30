#!/bin/bash
# ============================================
# 🚀 Deployment Script for Development - MAU App
# Author: Wisnu Hidayat
# ============================================

set -e
set -o pipefail

# Ensure PATH so poetry/npm/node are discoverable
export PATH="$PATH:/home/wisnu/.local/bin:/usr/local/bin:/usr/bin"

APP_DIR="/home/wisnu/mau-app"
FRONTEND_DIR="$APP_DIR/astro"
BACKEND_DIR="$APP_DIR/materialize-fastapi"
BRANCH="master"
LOG_FILE="$APP_DIR/deploy-logs/development-$(date +'%Y%m%d_%H%M%S').log"

mkdir -p "$APP_DIR/deploy-logs"

# Simple failure trap for clear feedback in logs
trap 'echo "❌ Deployment failed at $(date). See log: $LOG_FILE"' ERR

{
echo "=============================================="
echo "🚧  DEVELOPMENT DEPLOYMENT STARTED: $(date)"
echo "Branch: $BRANCH"
echo "Working directory: $APP_DIR"
echo "=============================================="

# --- Update repository ---
cd "$APP_DIR"
echo "📦 Pulling latest changes from $BRANCH..."
git fetch origin
git checkout $BRANCH
git reset --hard origin/$BRANCH
git clean -fd
git pull origin $BRANCH
echo "✅ Git updated successfully."

# --- Build Frontend (Astro) ---
if [ -d "$FRONTEND_DIR" ]; then
  echo "🧩 Building frontend (Astro)..."
  cd "$FRONTEND_DIR"
  npm ci --legacy-peer-deps
  npm run build
  echo "✅ Frontend build completed."
else
  echo "⚠️  Frontend directory not found: $FRONTEND_DIR"
fi

# --- Backend dependencies (Poetry) ---
if [ -d "$BACKEND_DIR" ]; then
  echo "📦 Installing backend dependencies (poetry)..."
  cd "$BACKEND_DIR"

  # Ensure Poetry is available
  if ! command -v poetry &> /dev/null; then
    echo "⚠️ Poetry not found. Installing local version..."
    pip install --user "poetry==2.2.1"
    export PATH="$HOME/.local/bin:$PATH"
  fi

  # Check Poetry version
  POETRY_VERSION=$(poetry --version | awk '{print $3}' | tr -d '()')
  echo "ℹ️  Poetry version: $POETRY_VERSION"

  # Auto-fix lock mismatch
  if ! poetry check --lock >/dev/null 2>&1; then
    echo "⚠️  Lock file out of sync with pyproject.toml, regenerating..."
    poetry lock --no-update
  fi

  # Install deps safely
  poetry install --no-root --sync
  echo "✅ Backend dependencies installed."
else
  echo "⚠️  Backend directory not found: $BACKEND_DIR"
fi

# --- Restart Backend (via Supervisor) ---
if [ -d "$BACKEND_DIR" ]; then
  echo "🔁 Restarting backend via Supervisor..."
  cd "$BACKEND_DIR"

  chmod 775 "$BACKEND_DIR/run-prod.sh"

  if [ ! -d "/var/log/materialize-fastapi" ]; then
    echo "🪶 Creating log directory: /var/log/materialize-fastapi"
    sudo mkdir -p /var/log/materialize-fastapi || true
    sudo chown wisnu:wisnu /var/log/materialize-fastapi || true
  fi

  if command -v supervisorctl &> /dev/null; then
    sudo supervisorctl reread || true
    sudo supervisorctl update || true
    sudo supervisorctl restart materialize-fastapi
    echo "✅ Backend restarted via Supervisor."
  else
    echo "⚠️ supervisorctl not found. Please install/configure Supervisor."
    exit 1
  fi
fi

# --- Restart Frontend SSR (via Supervisor) ---
if [ -d "$FRONTEND_DIR" ]; then
  echo "🔁 Restarting frontend via Supervisor..."
  cd "$FRONTEND_DIR"

  if [ ! -f "$FRONTEND_DIR/dist/server/entry.mjs" ]; then
    echo "⚠️  SSR entry not found: $FRONTEND_DIR/dist/server/entry.mjs"
  fi

  if [ ! -d "/var/log/astro" ]; then
    echo "🪶 Creating log directory: /var/log/astro"
    sudo mkdir -p /var/log/astro || true
    sudo chown wisnu:wisnu /var/log/astro || true
  fi

  if command -v supervisorctl &> /dev/null; then
    sudo supervisorctl reread || true
    sudo supervisorctl update || true
    sudo supervisorctl restart astro-app
    echo "✅ Frontend restarted via Supervisor."
  else
    echo "⚠️ supervisorctl not found. Please install/configure Supervisor."
    exit 1
  fi
fi

chmod 775 /home/wisnu/mau-app/materialize-fastapi/run-prod.sh

echo "🎉 Development deployment completed successfully."
echo "=============================================="
echo "Completed at: $(date)"
} | tee -a "$LOG_FILE"
