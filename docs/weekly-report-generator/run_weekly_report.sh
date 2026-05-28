#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
python3 docs/weekly-report-generator/generate_weekly_report.py \
  --days 7 \
  --send-email \
  --fallback-models "${GEMINI_FALLBACK_MODELS:-gemini-2.5-flash,gemini-2.0-flash}" \
  --model-retry-delay "${GEMINI_MODEL_RETRY_DELAY:-5}"
