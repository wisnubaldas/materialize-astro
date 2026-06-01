"""Generate and optionally email the MAU APP weekly report."""

from __future__ import annotations

import argparse
import json
import os
import re
import smtplib
import sys
import time
import urllib.error
import urllib.request
from datetime import date, timedelta
from email.message import EmailMessage
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
DOCS_DIR = PROJECT_ROOT / "docs"
PROGRESS_DIR = DOCS_DIR / "report-progress"
WEEKLY_DIR = DOCS_DIR / "report-mingguan"
GUIDE_FILE = DOCS_DIR / "prompt-report-mingguan.md"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)
GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = "gemini-flash-latest"
DEFAULT_DAYS = 7
DEFAULT_TIMEOUT = 120
DEFAULT_FALLBACK_MODELS = "gemini-2.5-flash,gemini-2.0-flash"
DEFAULT_AUTO_MODEL_FALLBACK = True
DEFAULT_MODEL_RETRY_DELAY = 5
FALLBACK_HTTP_STATUS_CODES = {429, 500, 503}


class GeminiRequestError(Exception):
    """Raised when Gemini returns an HTTP response that may need fallback handling."""

    def __init__(self, status_code: int, body: str) -> None:
        super().__init__(f"Gemini HTTP {status_code}: {body}")
        self.status_code = status_code
        self.body = body


def load_env_file() -> None:
    env_file = SCRIPT_DIR / ".env"
    if not env_file.exists():
        return

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate weekly MAU APP / CTOS report."
    )
    parser.add_argument("--days", type=int, default=DEFAULT_DAYS, help="Default: 7.")
    parser.add_argument("--start", help="YYYY-MM-DD. Optional.")
    parser.add_argument("--end", help="YYYY-MM-DD. Optional.")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument(
        "--fallback-models",
        default=os.environ.get("GEMINI_FALLBACK_MODELS", DEFAULT_FALLBACK_MODELS),
        help="Comma/semicolon separated Gemini models used after rate limit or transient errors.",
    )
    parser.add_argument(
        "--no-auto-model-fallback",
        action="store_true",
        default=not parse_bool_env("GEMINI_AUTO_MODEL_FALLBACK", DEFAULT_AUTO_MODEL_FALLBACK),
        help="Disable fetching all generateContent models from the Gemini models API after rate limit.",
    )
    parser.add_argument(
        "--model-retry-delay",
        type=int,
        default=int(os.environ.get("GEMINI_MODEL_RETRY_DELAY", DEFAULT_MODEL_RETRY_DELAY)),
        help="Seconds to wait before trying the next fallback model.",
    )
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    parser.add_argument(
        "--max-output-tokens",
        type=int,
        help="Optional Gemini output token limit. Omit to let Gemini use its default limit.",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--send-email", action="store_true")
    parser.add_argument(
        "--email-to", help="Override SMTP_TO. Separate by comma or semicolon."
    )
    parser.add_argument(
        "--email-cc", help="Override SMTP_CC. Separate by comma or semicolon."
    )
    args = parser.parse_args()
    if args.days < 1:
        parser.error("--days must be at least 1.")
    if args.timeout < 1:
        parser.error("--timeout must be at least 1.")
    if args.max_output_tokens is not None and args.max_output_tokens < 1:
        parser.error("--max-output-tokens must be at least 1.")
    if args.model_retry_delay < 0:
        parser.error("--model-retry-delay must be 0 or greater.")
    return args


def parse_date(value: str) -> date:
    return date.fromisoformat(value)


def find_progress_files() -> list[tuple[date, Path]]:
    files: list[tuple[date, Path]] = []
    for path in sorted(PROGRESS_DIR.glob("progress-*.md")):
        match = re.match(r"progress-(\d{4}-\d{2}-\d{2})\.md$", path.name)
        if match:
            files.append((parse_date(match.group(1)), path))
    if not files:
        raise SystemExit("No progress files found in docs/report-progress.")
    return files


def resolve_report_period(
    files: list[tuple[date, Path]], args: argparse.Namespace
) -> tuple[date, date]:
    end = parse_date(args.end) if args.end else max(item[0] for item in files)
    start = (
        parse_date(args.start) if args.start else end - timedelta(days=args.days - 1)
    )
    if end < start:
        raise SystemExit("--end must be later than or equal to --start.")
    return start, end


def previous_report() -> str:
    reports = sorted(WEEKLY_DIR.glob("laporan-progress-mingguan-ctos-mau-app-*.md"))
    return reports[-1].read_text(encoding="utf-8") if reports else "Belum ada."


def build_prompt(start: date, end: date, selected_paths: list[Path]) -> str:
    sources = "\n\n---\n\n".join(
        f"# {path.as_posix()}\n\n{path.read_text(encoding='utf-8')}"
        for path in selected_paths
    )
    return f"""
Anda adalah senior project reporter untuk MAU APP / CTOS.
Buat laporan progress mingguan dalam format email Markdown.

Periode laporan: {start.isoformat()} sampai {end.isoformat()}.

Panduan wajib:
---
{GUIDE_FILE.read_text(encoding="utf-8")}
---

Report minggu sebelumnya:
---
{previous_report()}
---

Progress periode ini:
---
{sources}
---

Instruksi:
- Output hanya Markdown final, mulai dari baris Subject.
- Bahasa Indonesia formal, ringkas, mudah dipahami stakeholder.
- Fokus pada capaian, dampak operasional, risiko/blocker, dan next step.
- Bagian Dampak terhadap Operasional hanya untuk dampak langsung ke proses gudang cargo/user operasional.
- Jangan masukkan tooling internal developer, otomasi laporan, aturan AI agent, atau efisiensi administrasi proyek ke Dampak terhadap Operasional.
- Jangan klaim selesai jika sumber masih mencatat gap atau verifikasi belum lengkap.
""".strip()


def extract_gemini_text(data: dict) -> str:
    try:
        parts = data["candidates"][0]["content"]["parts"]
        text = "".join(part.get("text", "") for part in parts).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise SystemExit(
            f"Unexpected Gemini response: {json.dumps(data, ensure_ascii=False)}"
        ) from exc
    return re.sub(r"^```[a-zA-Z0-9_-]*\s*|\s*```$", "", text).strip() + "\n"


def parse_bool_env(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def normalize_model_name(model: str) -> str:
    model = model.strip()
    prefix = "models/"
    if model.startswith(prefix):
        return model[len(prefix) :].strip()
    return model


def unique_models(primary_model: str, fallback_models: str) -> list[str]:
    models: list[str] = []
    for model in [primary_model, *re.split(r"[;,]", fallback_models or "")]:
        model = normalize_model_name(model)
        if model and model not in models:
            models.append(model)
    return models


def append_unique_models(models: list[str], candidates: list[str]) -> None:
    for candidate in candidates:
        model = normalize_model_name(candidate)
        if model and model not in models:
            models.append(model)


def fetch_generate_content_models(api_key: str, timeout: int) -> list[str]:
    request = urllib.request.Request(
        GEMINI_MODELS_URL,
        headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(f"Could not fetch Gemini model list: HTTP {exc.code}")
        return []
    except (urllib.error.URLError, TimeoutError) as exc:
        print(f"Could not fetch Gemini model list: {exc}")
        return []

    models: list[str] = []
    for item in data.get("models", []):
        actions = (
            item.get("supportedActions")
            or item.get("supportedGenerationMethods")
            or item.get("supported_actions")
            or []
        )
        if "generateContent" in actions:
            models.append(normalize_model_name(item.get("name", "")))
    return models


def request_gemini(prompt: str, args: argparse.Namespace, api_key: str, model: str) -> str:
    generation_config = {"temperature": 0.2}
    if args.max_output_tokens is not None:
        generation_config["maxOutputTokens"] = args.max_output_tokens

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }
    request = urllib.request.Request(
        GEMINI_URL.format(model=model),
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=args.timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise GeminiRequestError(exc.code, exc.read().decode("utf-8", "replace")) from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise SystemExit(f"Gemini request failed: {exc}") from exc

    return extract_gemini_text(data)


def generate_report_with_gemini(prompt: str, args: argparse.Namespace) -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit(
            "GEMINI_API_KEY is empty. Fill docs/weekly-report-generator/.env."
        )

    models = unique_models(args.model, args.fallback_models)
    last_error: GeminiRequestError | None = None
    fetched_dynamic_models = False
    index = 0
    while index < len(models):
        model = models[index]
        try:
            print(f"Generating report with Gemini model: {model}")
            return request_gemini(prompt, args, api_key, model)
        except GeminiRequestError as exc:
            last_error = exc
            if exc.status_code not in FALLBACK_HTTP_STATUS_CODES:
                raise SystemExit(str(exc)) from exc

            if not args.no_auto_model_fallback and not fetched_dynamic_models:
                fetched_dynamic_models = True
                print("Fetching Gemini generateContent model list for dynamic fallback.")
                append_unique_models(models, fetch_generate_content_models(api_key, args.timeout))

            next_index = index + 1
            if next_index >= len(models):
                raise SystemExit(str(exc)) from exc

            next_model = models[next_index]
            print(
                f"Gemini HTTP {exc.status_code} on model {model}; "
                f"trying fallback model {next_model} in {args.model_retry_delay}s."
            )
            if args.model_retry_delay:
                time.sleep(args.model_retry_delay)
        index += 1

    raise SystemExit(str(last_error) if last_error else "No Gemini model configured.")


def parse_addresses(value: str) -> list[str]:
    return [item.strip() for item in re.split(r"[;,]", value or "") if item.strip()]


def subject_and_body(report: str, fallback: str) -> tuple[str, str]:
    lines = report.splitlines()
    if lines and lines[0].lower().startswith("subject:"):
        return lines[0].split(":", 1)[1].strip(), "\n".join(lines[1:]).lstrip()
    return fallback, report


def send_email(report: str, fallback_subject: str, args: argparse.Namespace) -> None:
    host = os.environ.get("SMTP_HOST", "smtp.office365.com")
    port = int(os.environ.get("SMTP_PORT", "587"))
    use_starttls = parse_bool_env("SMTP_USE_STARTTLS", default=True)
    username = os.environ.get("SMTP_USERNAME", "")
    password = os.environ.get("SMTP_PASSWORD", "")
    sender = os.environ.get("SMTP_FROM", username)
    to = parse_addresses(args.email_to or os.environ.get("SMTP_TO", ""))
    cc = parse_addresses(args.email_cc or os.environ.get("SMTP_CC", ""))
    bcc = parse_addresses(os.environ.get("SMTP_BCC", ""))

    if not all([username, password, sender]) or not to:
        raise SystemExit(
            "Fill SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM, and SMTP_TO in .env."
        )

    subject, body = subject_and_body(report, fallback_subject)
    message = EmailMessage()
    message["From"] = sender
    message["To"] = ", ".join(to)
    if cc:
        message["Cc"] = ", ".join(cc)
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(host, port, timeout=60) as smtp:
        if use_starttls:
            smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(message, from_addr=sender, to_addrs=to + cc + bcc)
    print(f"Email sent to {', '.join(to)}")


def weekly_report_path(start: date, end: date) -> Path:
    filename = (
        f"laporan-progress-mingguan-ctos-mau-app-{start.isoformat()}-{end.day:02d}.md"
    )
    return WEEKLY_DIR / filename


def main() -> int:
    load_env_file()
    args = parse_args()
    files = find_progress_files()
    start, end = resolve_report_period(files, args)
    selected_paths = [path for day, path in files if start <= day <= end]
    if not selected_paths:
        raise SystemExit(f"No progress files found from {start} to {end}.")

    prompt = build_prompt(start, end, selected_paths)
    if args.dry_run:
        print(prompt)
        return 0

    report = generate_report_with_gemini(prompt, args)
    WEEKLY_DIR.mkdir(parents=True, exist_ok=True)
    output = weekly_report_path(start, end)
    output.write_text(report, encoding="utf-8")
    print(f"Report generated: {output}")

    if args.send_email:
        fallback = f"Laporan Progress Mingguan MAU APP / CTOS - {start.isoformat()} sampai {end.isoformat()}"
        send_email(report, fallback, args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
