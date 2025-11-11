import json
import os


class SSEUTIL:
    @staticmethod
    def read_last_json_lines(path: str, limit: int = 10):
        result = []
        try:
            with open(path, "rb") as f:  # noqa: PTH123
                f.seek(0, os.SEEK_END)
                buffer = bytearray()
                lines = 0

                while f.tell() > 0 and lines < limit:
                    f.seek(-2, os.SEEK_CUR)
                    char = f.read(1)
                    if char == b"\n":
                        try:
                            line = buffer.decode("utf-8")[::-1]
                        except UnicodeDecodeError:
                            line = buffer.decode("latin1")[::-1]
                        # line = buffer.decode(errors="replace")[::-1]
                        try:  # noqa: SIM105
                            result.append(json.loads(line))
                        except json.JSONDecodeError:
                            pass
                        buffer = bytearray()
                        lines += 1
                    else:
                        buffer.extend(char)

                if buffer:
                    try:  # noqa: SIM105
                        result.append(json.loads(buffer.decode()[::-1]))
                    except:  # noqa: E722
                        pass
        except FileNotFoundError:
            return []

        return list(reversed(result))
