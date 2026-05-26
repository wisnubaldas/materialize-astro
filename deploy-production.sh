#!/bin/bash
# ============================================
# 🚀 Deployment Script for Production - MAU App
# Author: Wisnu Hidayat
# ============================================

set -e
set -o pipefail

# Ensure PATH so poetry/npm/node are discoverable
export PATH="$PATH:/home/wisnu/.local/bin:/usr/local/bin:/usr/bin"

APP_DIR="/home/wisnu/mau-app"
FRONTEND_DIR="$APP_DIR/astro"
BACKEND_DIR="$APP_DIR/materialize-fastapi"
BRANCH="production"
LOG_FILE="$APP_DIR/deploy-logs/production-$(date +'%Y%m%d_%H%M%S').log"
POETRY_REQUIRED_VERSION="1.8.4"

mkdir -p "$APP_DIR/deploy-logs"

# Simple failure trap for clear feedback in logs
trap 'echo "❌ Deployment failed at $(date). See log: $LOG_FILE"' ERR

{
echo "=============================================="
echo "🏁  PRODUCTION DEPLOYMENT STARTED: $(date)"
echo "Script path: $(readlink -f "$0")"
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

  if ! command -v poetry &> /dev/null; then
    echo "⚠️ Poetry not found. Installing local version..."
    python3 -m pip install --user "poetry==${POETRY_REQUIRED_VERSION}" || \
    python3 -m pip install --user "poetry>=1.8,<1.9"
    export PATH="$HOME/.local/bin:$PATH"
  fi

  POETRY_VERSION=$(poetry --version | awk '{print $3}' | tr -d '()')
  echo "ℹ️ Poetry version: $POETRY_VERSION"
  if [ "$(printf '%s\n' "$POETRY_REQUIRED_VERSION" "$POETRY_VERSION" | sort -V | head -n1)" != "$POETRY_REQUIRED_VERSION" ]; then
    echo "⚠️ Poetry terlalu lama. Upgrading ke $POETRY_REQUIRED_VERSION..."
    if python3 -m pip install --user --upgrade "poetry==${POETRY_REQUIRED_VERSION}"; then
      export PATH="$HOME/.local/bin:$PATH"
      POETRY_VERSION=$(poetry --version | awk '{print $3}' | tr -d '()')
      echo "ℹ️ Poetry version after upgrade: $POETRY_VERSION"
    else
      echo "⚠️ Gagal upgrade Poetry ke ${POETRY_REQUIRED_VERSION}, lanjut dengan versi saat ini."
    fi
  fi

  # Ensure build + runtime deps for pycairo / WeasyPrint are available.
  echo "🧩 Ensuring system deps for pycairo/WeasyPrint..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -y
    sudo apt-get install -y \
      build-essential \
      pkg-config \
      python3-dev \
      libcairo2 \
      libcairo2-dev \
      pango1.0-tools \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libgdk-pixbuf2.0-0 \
      libffi-dev \
      shared-mime-info
  fi

  # Keep env local to project so runtime scripts are predictable.
  poetry config virtualenvs.in-project true --local

  if ! poetry check --lock >/dev/null 2>&1; then
    echo "⚠️  Lock file out of sync with pyproject.toml, regenerating..."
    poetry lock --no-update
  fi

  poetry install --no-root --sync
  ENV_PATH=$(poetry env info -p 2>/dev/null || true)
  if [ -z "$ENV_PATH" ]; then
    echo "❌ Poetry environment tidak ditemukan."
    poetry env list || true
    exit 1
  fi
  echo "ℹ️ Poetry env path: $ENV_PATH"

  # Pastikan runtime selalu punya .venv path yang konsisten untuk supervisor.
  if [ "$ENV_PATH" != "$BACKEND_DIR/.venv" ]; then
    ln -sfn "$ENV_PATH" "$BACKEND_DIR/.venv"
  fi

  if [ ! -x "$BACKEND_DIR/.venv/bin/gunicorn" ]; then
    echo "❌ gunicorn tidak ditemukan di $BACKEND_DIR/.venv/bin/gunicorn"
    ls -la "$BACKEND_DIR/.venv/bin" || true
    exit 1
  fi

  "$BACKEND_DIR/.venv/bin/python" --version
  "$BACKEND_DIR/.venv/bin/python" -c "import cairo; print(cairo.version)"
  "$BACKEND_DIR/.venv/bin/python" -c "from weasyprint import HTML; HTML(string='<h1>ok</h1>').write_pdf('/tmp/weasyprint-smoke-prod.pdf')"
  "$BACKEND_DIR/.venv/bin/gunicorn" --version
  echo "✅ Backend dependencies installed."
else
  echo "⚠️  Backend directory not found: $BACKEND_DIR"
fi

# --- Restart Backend (via Supervisor) ---
if [ -d "$BACKEND_DIR" ]; then
  echo "🔁 Restarting backend via Supervisor..."
  cd "$BACKEND_DIR"

  chmod 775 "$BACKEND_DIR/run-prod.sh"

  if command -v supervisorctl &> /dev/null; then
    SUPER_CONF=$(sudo sh -c "grep -Rsl '\\[program:materialize-fastapi\\]' /etc/supervisor* /etc/supervisord* 2>/dev/null | head -n 1")
    if [ -n "$SUPER_CONF" ]; then
      echo "ℹ️ Supervisor config: $SUPER_CONF"
      sudo sed -n '/\[program:materialize-fastapi\]/,/^\[/p' "$SUPER_CONF" | head -n 40 || true

      SUPER_USER=$(sudo awk '
        /^\[program:materialize-fastapi\]/{in_prog=1; next}
        /^\[/{if (in_prog) exit}
        in_prog && /^[[:space:]]*user[[:space:]]*=/ {
          sub(/^[^=]*=[[:space:]]*/, "", $0)
          gsub(/[[:space:]]+$/, "", $0)
          print
          exit
        }
      ' "$SUPER_CONF")
      if [ -z "$SUPER_USER" ]; then
        SUPER_USER="wisnu"
      fi
      SUPER_GROUP=$(id -gn "$SUPER_USER" 2>/dev/null || echo "$SUPER_USER")
      echo "ℹ️ Supervisor run user: $SUPER_USER:$SUPER_GROUP"
    else
      echo "⚠️ Config [program:materialize-fastapi] tidak ditemukan di /etc/supervisor*"
      SUPER_USER="wisnu"
      SUPER_GROUP="wisnu"
    fi

    echo "🪶 Ensuring log directory: /var/log/materialize-fastapi"
    sudo mkdir -p /var/log/materialize-fastapi || true
    sudo touch /var/log/materialize-fastapi/access.log /var/log/materialize-fastapi/error.log || true
    sudo chown -R "$SUPER_USER:$SUPER_GROUP" /var/log/materialize-fastapi || true
    sudo chmod 775 /var/log/materialize-fastapi || true
    sudo chmod 664 /var/log/materialize-fastapi/access.log /var/log/materialize-fastapi/error.log || true

    echo "🪶 Ensuring backend runtime storage is writable by Supervisor user"
    sudo mkdir -p \
      "$BACKEND_DIR/app/storage/generated_pdf/build_up" \
      "$BACKEND_DIR/app/storage/public/pdf" || true
    sudo chown -R "$SUPER_USER:$SUPER_GROUP" "$BACKEND_DIR/app/storage" || true
    sudo chmod -R u+rwX,g+rwX "$BACKEND_DIR/app/storage" || true

    sudo supervisorctl reread || true
    sudo supervisorctl update || true
    if ! sudo supervisorctl restart materialize-fastapi; then
      echo "❌ Gagal restart materialize-fastapi."
      sudo supervisorctl status materialize-fastapi || true
      echo "----- supervisor stderr tail (materialize-fastapi) -----"
      sudo supervisorctl tail -100 materialize-fastapi stderr || true
      echo "----- supervisor stdout tail (materialize-fastapi) -----"
      sudo supervisorctl tail -100 materialize-fastapi stdout || true
      if [ -f "/var/log/materialize-fastapi/error.log" ]; then
        echo "----- /var/log/materialize-fastapi/error.log (tail) -----"
        sudo tail -n 120 /var/log/materialize-fastapi/error.log || true
      fi
      exit 1
    fi
    if ! sudo supervisorctl restart scheduler-fastapi; then
      echo "❌ Gagal restart scheduler-fastapi."
      sudo supervisorctl status scheduler-fastapi || true
      exit 1
    fi
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

echo "🎉 Production deployment completed successfully."
echo "=============================================="
echo "Completed at: $(date)"
} | tee -a "$LOG_FILE"
