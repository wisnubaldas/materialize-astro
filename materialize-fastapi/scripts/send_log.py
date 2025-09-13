import logging
from logstash_async.handler import AsynchronousLogstashHandler
from logstash_async.formatter import LogstashFormatter  # ini formatter yg ada di v3

def setup_logger():
    logger = logging.getLogger("elk-test")
    logger.setLevel(logging.DEBUG)

    # setting koneksi ke Logstash
    logstash_handler = AsynchronousLogstashHandler(
        host="11.10.10.21",   # IP server Logstash
        port=5000,            # port Logstash input (bukan 9200/5601)
        database_path=None    # disable sqlite buffer, langsung kirim
    )

    # formatter bawaan v3
    formatter = LogstashFormatter(message_type="fastapi-app")
    logstash_handler.setFormatter(formatter)

    logger.addHandler(logstash_handler)
    return logger

if __name__ == "__main__":
    logger = setup_logger()

    logger.info("🚀 Test log INFO dikirim ke ELK", extra={"service": "invoice-service"})
    logger.warning("⚠️ Test log WARNING dikirim ke ELK", extra={"service": "celery-worker"})
    logger.error("🔥 Test log ERROR dikirim ke ELK", extra={"service": "angkasapura"})
