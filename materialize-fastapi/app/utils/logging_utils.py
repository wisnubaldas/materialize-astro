import io
import logging
import sys
import time
from collections.abc import Callable
from contextlib import contextmanager
from contextvars import ContextVar
from functools import wraps
from typing import Any, TypeVar, cast

F = TypeVar("F", bound=Callable[..., Any])


_task_name_ctx: ContextVar[str | None] = ContextVar("taskName", default=None)


def set_task_name(name: str | None) -> None:
    """Set taskName for current context (appears in JSON logs)."""
    _task_name_ctx.set(name)


@contextmanager
def task_name(name: str):
    """Context manager to set taskName during a block.

    Example:
        with task_name("hubnet-fetch"):
            print("...")
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
            record.taskName  # type: ignore[attr-defined]
        except Exception:
            record.taskName = _task_name_ctx.get()  # type: ignore[attr-defined]
        else:
            if getattr(record, "taskName", None) is None:
                record.taskName = _task_name_ctx.get()  # type: ignore[attr-defined]
        return True


def log_execution(
    logger_name: str | None = None,
    level: int = logging.INFO,
    log_args: bool = False,
    log_result: bool = False,
) -> Callable[[F], F]:
    """Decorator to log entry, exit, duration, and exceptions of a function.

    - logger_name: override logger name; defaults to module logger where function is defined
    - level: logging level for entry/exit
    - log_args: include args/kwargs in entry log
    - log_result: include return value in exit log
    """

    def decorator(func: F) -> F:
        logger = logging.getLogger(logger_name or func.__module__)

        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any):
            start = time.perf_counter()

            # Capture print() output while still allowing it to appear in stdout
            buffer = io.StringIO()

            class _Tee:
                def __init__(self, a, b):
                    self._a = a
                    self._b = b

                def write(self, s):
                    try:  # noqa: SIM105
                        self._a.write(s)
                    except Exception:
                        pass
                    self._b.write(s)
                    return len(s)

                def flush(self):
                    try:  # noqa: SIM105
                        self._a.flush()
                    except Exception:
                        pass
                    self._b.flush()

                def isatty(self):  # type: ignore[override]
                    return False

            tee = _Tee(sys.stdout, buffer)
            try:
                # Entry log without function name
                if log_args:
                    logger.log(
                        level,
                        "enter",
                        extra={"event": "enter", "args": str(args), "kwargs": str(kwargs)},
                    )
                # else:
                #     logger.log(level, "enter", extra={"event": "enter"})

                # Redirect stdout to tee
                orig_stdout = sys.stdout
                sys.stdout = tee  # type: ignore[assignment]
                try:
                    result = func(*args, **kwargs)
                finally:
                    sys.stdout = orig_stdout  # always restore

                # Dump captured prints into logs (line by line)
                printed = buffer.getvalue()
                if printed:
                    for line in printed.splitlines():
                        if line.strip():
                            logger.log(level, line, extra={"event": "print"})

                duration_ms = int((time.perf_counter() - start) * 1000)
                if log_result:
                    logger.log(
                        level,
                        "success",
                        extra={
                            "event": "success",
                            "duration_ms": duration_ms,
                            "result": str(result),
                        },
                    )
                else:
                    logger.log(
                        level, "success", extra={"event": "success", "duration_ms": duration_ms}
                    )
                return result
            except Exception:
                # Dump any captured prints before reporting error
                printed = buffer.getvalue()
                if printed:
                    for line in printed.splitlines():
                        if line.strip():
                            logger.log(level, line, extra={"event": "print"})
                duration_ms = int((time.perf_counter() - start) * 1000)
                logger.exception("error", extra={"event": "error", "duration_ms": duration_ms})
                raise

        return cast(F, wrapper)

    return decorator


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
        self.logger.log(self.level, "-> %s", self.name)
        return self

    def __exit__(self, exc_type, exc, tb):
        duration_ms = int((time.perf_counter() - self._start) * 1000)
        if exc is None:
            self.logger.log(self.level, "OK %s (%dms)", self.name, duration_ms)
            return False
        self.logger.exception("ERR %s failed after %dms", self.name, duration_ms)
        return False
