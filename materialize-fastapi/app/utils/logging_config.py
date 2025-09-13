import logging
import sys
from app.db.db_logger import DBLogHandler
def setup_logging():
    # Console logging
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    ))

# DB logging
    db_handler = DBLogHandler()
    db_handler.setLevel(logging.INFO)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers.clear()   # penting! biar tidak dobel dari Celery
    root_logger.addHandler(console_handler)
    root_logger.addHandler(db_handler)
    
    # pastikan logger angkasapura ikut root
    angkasapura_logger = logging.getLogger("angkasapura")
    angkasapura_logger.setLevel(logging.INFO)
    angkasapura_logger.propagate = True
    
