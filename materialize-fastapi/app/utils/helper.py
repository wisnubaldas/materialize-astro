from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path


class HELPER:
    @staticmethod
    def load_sql_query(filepath: str) -> str:
        with Path.open(filepath, encoding="utf-8") as f:
            return f.read()

    @staticmethod
    def to_string_rounded(value, digits=0):
        if isinstance(value, Decimal):
            return str(value.quantize(Decimal(10) ** -digits, rounding=ROUND_HALF_UP))
        elif isinstance(value, float):
            return str(round(value, digits))
        elif isinstance(value, int):
            return str(value)  # int tidak perlu dibulatkan
        return value
