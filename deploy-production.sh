#!/bin/bash
# ============================================
# 🚀 Deployment Script for Production - MAU App
# Author: Wisnu Hidayat
# ============================================

set -e
set -o pipefail

# Pastikan PATH lengkap agar GitLab Runner bisa menemukan poetry/npm/node
export PATH="$PATH:/home/wisnu/.local/bin:/usr/local/bin:/usr/bin"

APP_DIR="/home/wisnu/mau-app"
FRONTEND_DIR="$APP_DIR/template-baru"
BACKEND_DIR="$APP_DIR/materialize-fastapi"
BRANCH="production"
LOG_FILE="$APP_DIR/deploy-logs/production-$(date +'%Y%m%d_%H%M%S').log"

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID}"

send_telegram() {
    local status="$1"
    local message="🚀 *Production Deployment - MAU App*\n\n*Status:* $status\n*Branch:* $BRANCH\n*Server:* $(hostname)\n*Time:* $(date '+%Y-%m-%d %H:%M:%S')"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
         -d chat_id="${TELEGRAM_CHAT_ID}" \
         -d parse_mode="Markdown" \
         -d text="$message" > /dev/null
}

trap 'send_telegram "❌ Failed"' ERR

mkdir -p "$APP_DIR/deploy-logs"

{
echo "=============================================="
echo "🚀 DEPLOYMENT STARTED: $(date)"
echo "Branch: $BRANCH"
echo "Working directory: $APP_DIR"
echo "=============================================="

cd "$APP_DIR"
git fetch origin
git checkout $BRANCH
git reset --hard origin/$BRANCH
git clean -fd
git pull origin $BRANCH
echo "✅ Git updated successfully."

# --- Build frontend ---
if [ -d "$FRONTEND_DIR" ]; then
  echo "📦 Building frontend..."
  cd "$FRONTEND_DIR"
  npm install --legacy-peer-deps
  npm run build
  echo "✅ Frontend build completed."
fi

# --- Backend update ---
if [ -d "$BACKEND_DIR" ]; then
  echo "🧩 Updating backend..."
  cd "$BACKEND_DIR"
  # Coba beberapa kemungkinan lokasi poetry
  if command -v poetry &> /dev/null; then
    poetry install --without dev
  elif [ -x "/home/wisnu/.local/bin/poetry" ]; then
    /home/wisnu/.local/bin/poetry install --without dev
  elif [ -x "/usr/local/bin/poetry" ]; then
    /usr/local/bin/poetry install --without dev
  else
    echo "❌ Poetry not found. Please ensure poetry is installed for root or wisnu user."
    exit 1
  fi
  echo "✅ Backend dependencies installed."
fi

# --- Restart service ---
echo "🔁 Restarting services..."
if systemctl is-active --quiet apache2; then
  systemctl reload apache2 || systemctl restart apache2
elif systemctl is-active --quiet supervisor; then
  supervisorctl reread && supervisorctl update && supervisorctl restart all
elif pgrep gunicorn > /dev/null; then
  pkill -f gunicorn
  cd "$BACKEND_DIR"
  nohup poetry run gunicorn app.main:app --bind 0.0.0.0:8000 --workers 4 --daemon &
fi

chmod 775 /home/wisnu/mau-app/materialize-fastapi/run-prod.sh
echo "✅ Deployment finished successfully."
send_telegram "✅ Success"
echo "=============================================="
echo "Completed at: $(date)"
} | tee -a "$LOG_FILE"
