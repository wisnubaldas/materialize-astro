"""Background worker helpers for running API requests without blocking the UI."""

from __future__ import annotations

import logging
from typing import Any, Callable

from PySide6.QtCore import QObject, QThread, Signal


class FunctionWorker(QObject):
    """Execute a callable in a dedicated `QThread` and emit lifecycle signals."""

    finished = Signal()
    result = Signal(object)
    error = Signal(str)

    def __init__(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> None:
        """Create worker with callable and call arguments."""
        super().__init__()
        self._fn = fn
        self._args = args
        self._kwargs = kwargs

    def run(self) -> None:
        """Run callable and emit result or error message."""
        try:
            payload = self._fn(*self._args, **self._kwargs)
            self.result.emit(payload)
        except Exception as exc:  # noqa: BLE001
            logging.exception("Worker execution failed")
            message = str(exc).strip()
            if not message:
                message = f"{exc.__class__.__name__} (tanpa detail pesan)"
            self.error.emit(message)
        finally:
            self.finished.emit()


def run_in_thread(
    fn: Callable[..., Any],
    on_result: Callable[[Any], None],
    on_error: Callable[[str], None],
    on_finished: Callable[[], None],
    *args: Any,
    **kwargs: Any,
) -> tuple[QThread, FunctionWorker]:
    """Run `fn` in a `QThread` and wire result/error/finished callbacks."""
    thread = QThread()
    worker = FunctionWorker(fn, *args, **kwargs)
    worker.moveToThread(thread)
    thread.started.connect(worker.run)
    worker.result.connect(on_result)
    worker.error.connect(on_error)
    worker.finished.connect(on_finished)
    worker.finished.connect(thread.quit)
    worker.finished.connect(worker.deleteLater)
    thread.finished.connect(thread.deleteLater)
    thread.start()
    return thread, worker
