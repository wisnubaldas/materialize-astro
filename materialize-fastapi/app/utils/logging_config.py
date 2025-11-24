import atexit
import json
import logging
import os
import queue
import socket
import sys
from datetime import date, datetime, timezone
from decimal import Decimal
from logging.handlers import QueueHandler, QueueListener, TimedRotatingFileHandler
from typing import Any

from app.db.db_logger import DBLogHandler
from app.utils.logging_utils import TaskNameFilter

_listener: QueueListener | None = None


class LogstashJSONFormatter(logging.Formatter):
    """JSON log formatter that produces Logstash/Kibana-friendly payloads."""

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
        "taskName",
        "trace_id",
        "span_id",
        "traceId",
        "spanId",
    }

    def __init__(self, service_name: str, service_version: str | None, environment: str | None):
        super().__init__()
        self.service_name = service_name
        self.service_version = service_version
        self.environment = environment
        self.hostname = os.getenv("HOSTNAME") or socket.gethostname()

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()
        payload: dict[str, Any] = {
            "@timestamp": timestamp,
            "@version": "1",
            "message": record.getMessage(),
            "log.level": record.levelname.lower(),
            "log.logger": record.name,
            "log.origin.file.name": record.filename,
            "log.origin.function": record.funcName,
            "log.origin.line": record.lineno,
            "process.pid": record.process,
            "thread.name": record.threadName,
            "ecs.version": "1.12.1",
            "host.hostname": self.hostname,
        }

        if self.service_name:
            payload["service.name"] = self.service_name
            payload.setdefault("event.dataset", f"{self.service_name}.application")
        if self.service_version:
            payload["service.version"] = self.service_version
        if self.environment:
            payload["service.environment"] = self.environment

        task_name = getattr(record, "taskName", None)
        if task_name:
            payload["task.name"] = task_name

        trace_id = getattr(record, "trace_id", None) or getattr(record, "traceId", None)
        if trace_id:
            payload["trace.id"] = str(trace_id)

        span_id = getattr(record, "span_id", None) or getattr(record, "spanId", None)
        if span_id:
            payload["span.id"] = str(span_id)

        for key, value in record.__dict__.items():
            if key not in self._base_keys and not key.startswith("_"):
                payload.setdefault(key, self._coerce(value))

        if record.exc_info:
            payload["error.type"] = record.exc_info[0].__name__ if record.exc_info[0] else None
            payload["error.message"] = str(record.exc_info[1]) if record.exc_info[1] else None
            payload["error.stack_trace"] = self.formatException(record.exc_info)

        if record.stack_info:
            payload["log.stack"] = self.formatStack(record.stack_info)

        try:
            return json.dumps(payload, ensure_ascii=False)
        except TypeError:
            sanitized = {key: self._coerce(value) for key, value in payload.items()}
            return json.dumps(sanitized, ensure_ascii=False)

    def _coerce(self, value: Any) -> Any:  # noqa: PLR0911
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, set):
            return list(value)
        if isinstance(value, bytes):
            return value.decode("utf-8", errors="replace")
        if isinstance(value, Exception):
            return str(value)
        try:
            json.dumps(value)
            return value
        except TypeError:
            return repr(value)


def _is_enabled(value: str | None, *, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _resolve_log_level(default: str = "INFO") -> int:
    level_name = os.getenv("LOG_LEVEL", default).upper()
    return logging._nameToLevel.get(level_name, logging.INFO)


def _safe_int(value: str | None, default: int) -> int:
    try:
        return int(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def _stop_listener() -> None:
    """Stop queue listener if running (used on reconfigure/shutdown)."""
    global _listener  # noqa: PLW0603
    if _listener is not None:
        _listener.stop()
        _listener = None


atexit.register(_stop_listener)


def setup_logging() -> None:
    global _listener  # noqa: PLW0603

    _stop_listener()  # ensure we don't double-start listeners on reload

    service_name = (
        os.getenv("LOG_SERVICE_NAME")
        or os.getenv("APP_NAME")
        or os.getenv("SERVICE_NAME")
        or "materialize-fastapi"
    )
    service_version = os.getenv("LOG_SERVICE_VERSION") or os.getenv("APP_VERSION")
    environment = os.getenv("APP_ENV") or os.getenv("ENVIRONMENT")
    log_level = _resolve_log_level()

    formatter = LogstashJSONFormatter(
        service_name=service_name,
        service_version=service_version,
        environment=environment,
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    listener_handlers: list[logging.Handler] = [console_handler]

    if _is_enabled(os.getenv("LOG_TO_FILE"), default=True):
        log_dir = os.getenv("LOG_DIR", "logs")
        try:
            os.makedirs(log_dir, exist_ok=True)  # noqa: PTH103
        except OSError:
            log_dir = "."

        file_handler = TimedRotatingFileHandler(
            filename=os.path.join(log_dir, "app.log"),  # noqa: PTH118
            when="midnight",
            backupCount=_safe_int(os.getenv("LOG_BACKUP_COUNT"), default=7),
            encoding="utf-8",
            utc=True,
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        listener_handlers.append(file_handler)

    if _is_enabled(os.getenv("LOG_TO_DB")):
        db_handler = DBLogHandler()
        db_handler.setLevel(log_level)
        db_handler.setFormatter(formatter)
        listener_handlers.append(db_handler)

    log_queue: queue.SimpleQueue[logging.LogRecord] = queue.SimpleQueue()
    queue_handler = QueueHandler(log_queue)
    queue_handler.setLevel(log_level)
    queue_handler.set_name("queue-handler")

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()
    root_logger.addFilter(TaskNameFilter())

    # Send log records to a queue to avoid blocking on slow I/O handlers.
    root_logger.addHandler(queue_handler)

    _listener = QueueListener(log_queue, *listener_handlers, respect_handler_level=True)
    _listener.daemon = True  # type: ignore
    _listener.start()

    logging.captureWarnings(True)

    for logger_name in ("angkasapura", "hubnet"):
        named_logger = logging.getLogger(logger_name)
        named_logger.setLevel(log_level)
        named_logger.propagate = True
        named_logger.propagate = True
