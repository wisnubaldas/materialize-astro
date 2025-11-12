import json
import logging
import os

logger = logging.getLogger("hubnet")


class SSEUTIL:
    @staticmethod
    def read_last_json_lines(path: str, limit: int = 10):
        """
        Membaca maksimal 'limit' baris JSON terakhir dari file log besar dengan efisien.
        Urutan hasil: dari lama -> baru.
        """
        result = []
        try:
            with open(path, "rb") as f:  # noqa: PTH123
                # Posisikan di akhir file
                f.seek(0, os.SEEK_END)
                file_size = f.tell()

                buffer = bytearray()
                lines = []

                # Ukuran chunk baca (bisa disesuaikan)
                chunk_size = 4096

                # Baca mundur dalam blok sampai cukup baris
                while file_size > 0 and len(lines) < limit:
                    read_size = min(chunk_size, file_size)
                    file_size -= read_size
                    f.seek(file_size)
                    chunk = f.read(read_size)
                    buffer[:0] = chunk  # prepend chunk ke buffer

                    # Split per baris
                    lines = buffer.split(b"\n")

                # Ambil hanya baris terakhir sesuai limit
                last_lines = lines[-limit:]

                # Decode dan parse JSON satu per satu
                for raw_line in last_lines:
                    line = raw_line.strip()
                    if not line:
                        continue
                    try:
                        try:
                            decoded = line.decode("utf-8")
                        except UnicodeDecodeError:
                            decoded = line.decode("latin1")
                        obj = json.loads(decoded)
                        result.append(obj)
                    except json.JSONDecodeError:
                        # Skip baris yang bukan JSON valid
                        continue

        except FileNotFoundError:
            logger.error(f"SSE File not found: {path}")
        except Exception as e:
            logger.error(f"SSE Error reading log: {e}")
        return result
        # return list(reversed(result))
