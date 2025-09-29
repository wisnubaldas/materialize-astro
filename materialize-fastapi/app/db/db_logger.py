import logging
import traceback

from sqlalchemy import text

from app.db.mysql import SessionDB1W  # sesuaikan dengan session DB kamu


class DBLogHandler(logging.Handler):
    def emit(self, record: logging.LogRecord):
        session = SessionDB1W()
        try:
            msg = self.format(record)
            tb = None
            if record.exc_info:  # kalau ada exception
                tb = "".join(traceback.format_exception(*record.exc_info))

            sql = text("""
                INSERT INTO system_logs (level, logger, message, traceback)
                VALUES (:level, :logger, :message, :traceback)
            """)
            session.execute(sql, {
                "level": record.levelname,
                "logger": record.name,
                "message": msg,
                "traceback": tb,
            })
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"[DBLogHandler] Failed to log: {e}")
        finally:
            session.close()
