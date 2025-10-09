import logging
import time
from functools import wraps
from typing import Any, Callable, TypeVar, cast

F = TypeVar("F", bound=Callable[..., Any])


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
            try:
                if log_args:
                    logger.log(level, "-> %s args=%s kwargs=%s", func.__name__, args, kwargs)
                else:
                    logger.log(level, "-> %s", func.__name__)
                result = func(*args, **kwargs)
                duration_ms = int((time.perf_counter() - start) * 1000)
                if log_result:
                    logger.log(level, "OK %s (%dms) result=%s", func.__name__, duration_ms, result)
                else:
                    logger.log(level, "OK %s (%dms)", func.__name__, duration_ms)
                return result
            except Exception:
                duration_ms = int((time.perf_counter() - start) * 1000)
                logger.exception("ERR %s failed after %dms", func.__name__, duration_ms)
                raise

        return cast(F, wrapper)

    return decorator


class log_step:
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
