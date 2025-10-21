from __future__ import annotations

import asyncio
import signal
from contextlib import suppress

from app.utils.logging_config import setup_logging
from app.utils.scheduler import start_scheduler, stop_scheduler


async def _serve_scheduler() -> None:
    """Boot the APScheduler jobs and keep the event loop alive until a stop signal arrives."""
    setup_logging()
    await start_scheduler()

    stop_event = asyncio.Event()
    signals: list[int] = [signal.SIGINT]
    if hasattr(signal, "SIGTERM"):
        signals.append(signal.SIGTERM)  # type: ignore[arg-type]

    loop = asyncio.get_running_loop()
    async_registered: set[int] = set()

    def _notify_stop() -> None:
        if not stop_event.is_set():
            stop_event.set()

    def _sync_handler(signum: int, frame: object | None = None) -> None:  # noqa: ARG001
        _notify_stop()

    for sig in signals:
        try:
            loop.add_signal_handler(sig, _notify_stop)
            async_registered.add(sig)
        except NotImplementedError:
            signal.signal(sig, _sync_handler)

    try:
        await stop_event.wait()
    finally:
        await stop_scheduler()
        for sig in async_registered:
            with suppress(NotImplementedError):
                loop.remove_signal_handler(sig)
        for sig in set(signals) - async_registered:
            signal.signal(sig, signal.SIG_DFL)


def main() -> None:
    """Entrypoint for running the scheduler as a standalone worker."""
    try:
        asyncio.run(_serve_scheduler())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
