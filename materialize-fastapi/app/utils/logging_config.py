import json
import logging
import os
import sys
from datetime import datetime
from logging.handlers import TimedRotatingFileHandler

from app.db.db_logger import DBLogHandler
from app.utils.logging_utils import TaskNameFilter


class JSONFormatter(logging.Formatter):
    """Minimal JSON formatter for structured logs.

    Produces records with keys: timestamp, level, logger, message, and extras.
    Does not include function/method names by default.
    """

    # logging.LogRecord default attributes
    _base_keys = {  # noqa: RUF012
        "name",
        "msg",
        "args",
        "levelname",
        "levelno",
        "pathname",
        "filename",
        "module",
        "exc_info",
        "exc_text",
        "stack_info",
        "lineno",
        "funcName",
        "created",
        "msecs",
        "relativeCreated",
        "thread",
        "threadName",
        "process",
        "processName",
    }

    def format(self, record: logging.LogRecord) -> str:
        # Base envelope
        payload: dict[str, object] = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Extras (custom fields added via `extra=`)
        for key, value in record.__dict__.items():
            if key not in self._base_keys and not key.startswith("_"):
                # Avoid overriding base keys
                if key not in payload:
                    payload[key] = value

        # Exception serialization
        if record.exc_info:
            try:
                payload["exception"] = self.formatException(record.exc_info)
            except Exception:  # pragma: no cover - best effort
                payload["exception"] = "<unavailable>"

        if record.stack_info:
            payload["stack"] = self.formatStack(record.stack_info)

        try:
            return json.dumps(payload, ensure_ascii=False)
        except Exception:  # fallback to basic message if serialization fails
            return json.dumps(
                {
                    "timestamp": payload.get("timestamp"),
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                },
                ensure_ascii=False,
            )


def setup_logging():
    # Shared JSON formatter
    json_formatter = JSONFormatter()

    # Console logging (JSON)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(json_formatter)

    # File logging (daily rotation, keep 7 days) in JSON
    log_dir = os.getenv("LOG_DIR", "logs")
    try:
        os.makedirs(log_dir, exist_ok=True)  # noqa: PTH103
    except Exception:
        log_dir = "."  # fallback to current directory if cannot create
    file_handler = TimedRotatingFileHandler(
        filename=os.path.join(log_dir, "app.log"),  # noqa: PTH118
        when="midnight",
        backupCount=7,
        encoding="utf-8",
        utc=False,
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(json_formatter)

    # DB logging (also JSON payload string)
    db_handler = DBLogHandler()
    db_handler.setLevel(logging.INFO)
    db_handler.setFormatter(json_formatter)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers.clear()  # penting! biar tidak dobel dari Celery
    root_logger.addFilter(TaskNameFilter())
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    # root_logger.addHandler(db_handler)

    # pastikan logger angkasapura ikut root
    angkasapura_logger = logging.getLogger("angkasapura")
    angkasapura_logger.setLevel(logging.INFO)
    angkasapura_logger.propagate = True
