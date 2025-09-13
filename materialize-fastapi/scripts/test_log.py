import logging
from app.utils.logging_config import setup_logging
setup_logging()

logger = logging.getLogger("test")

logger.info("Coba masuk DB")
logger.error("Coba error masuk DB")
