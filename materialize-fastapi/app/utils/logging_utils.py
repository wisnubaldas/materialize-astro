import logging
import time
from contextlib import contextmanager
from contextvars import ContextVar

_task_name_ctx: ContextVar[str | None] = ContextVar("taskName", default=None)


def set_task_name(name: str | None) -> None:
    """Set taskName for current context (appears in JSON logs)."""
    _task_name_ctx.set(name)


@contextmanager
def task_name(name: str):
    """Context manager to set taskName during a block.

    Example:
        with task_name("hubnet-fetch"):
            logging.getLogger(__name__).info("Starting fetch")
    """
    token = _task_name_ctx.set(name)
    try:
        yield
    finally:
        _task_name_ctx.reset(token)


class TaskNameFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # Ensure every record has taskName, even if None
        try:
            record.taskName  # type: ignore[attr-defined]  # noqa: B018
        except Exception:
            record.taskName = _task_name_ctx.get()  # type: ignore[attr-defined]
        else:
            if getattr(record, "taskName", None) is None:
                record.taskName = _task_name_ctx.get()  # type: ignore[attr-defined]
        return True


class log_step:  # noqa: N801
    """Context manager to log an arbitrary step with timing.

    Example:
        with log_step("sync-invoice"):
            ...
    """

    def __init__(self, name: str, logger: logging.Logger | None = None, level: int = logging.INFO):
        self.name = name
        self.level = level
        self.logger = logger or logging.getLogger(__name__)
        self._start = 0.0

    def __enter__(self):
        self._start = time.perf_counter()
        self.logger.log(
            self.level,
            "step.start",
            extra={"event": "step.start", "step": self.name},
        )
        return self

    def __exit__(self, exc_type, exc, tb):
        duration_ms = int((time.perf_counter() - self._start) * 1000)
        if exc is None:
            self.logger.log(
                self.level,
                "step.success",
                extra={"event": "step.success", "step": self.name, "duration_ms": duration_ms},
            )
            return False
        self.logger.exception(
            "step.error",
            extra={"event": "step.error", "step": self.name, "duration_ms": duration_ms},
        )
        return False
