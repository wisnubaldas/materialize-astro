import logging
import os
import sys
from logging.handlers import TimedRotatingFileHandler

from app.db.db_logger import DBLogHandler


def setup_logging():
    # Console logging
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    )

    # File logging (daily rotation, keep 7 days)
    log_dir = os.getenv("LOG_DIR", "logs")
    try:
        os.makedirs(log_dir, exist_ok=True)
    except Exception:
        # fallback to current directory if cannot create
        log_dir = "."
    file_handler = TimedRotatingFileHandler(
        filename=os.path.join(log_dir, "app.log"),
        when="midnight",
        backupCount=7,
        encoding="utf-8",
        utc=False,
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(
        logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s:%(lineno)d %(message)s"
        )
    )

    # DB logging
    db_handler = DBLogHandler()
    db_handler.setLevel(logging.INFO)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers.clear()  # penting! biar tidak dobel dari Celery
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(db_handler)

    # pastikan logger angkasapura ikut root
    angkasapura_logger = logging.getLogger("angkasapura")
    angkasapura_logger.setLevel(logging.INFO)
    angkasapura_logger.propagate = True
