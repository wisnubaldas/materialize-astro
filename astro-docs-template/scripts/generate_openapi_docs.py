import json
from pathlib import Path

import requests

# Kamu bisa isi dengan path file lokal atau URL
OPENAPI_SOURCE = "http://110.239.87.173:8000/openapi.json"
OUTPUT_PATH = Path("docs/api_reference.md")


def load_openapi(source: str):
    """Baca openapi.json dari URL atau file lokal"""
    if source.startswith("http://") or source.startswith("https://"):
        print(f"📡 Fetching OpenAPI spec from URL: {source}")
        response = requests.get(source)
        response.raise_for_status()
        return response.json()
    else:
        print(f"📁 Loading OpenAPI spec from file: {source}")
        return json.loads(Path(source).read_text(encoding="utf-8"))


def generate_table():
    data = load_openapi(OPENAPI_SOURCE)

    lines = [
        "# API Reference\n\n",
        "Berikut daftar endpoint yang tersedia berdasarkan spesifikasi OpenAPI.\n\n",
        "| Method | Path | Summary | Tags |\n",
        "|--------|------|----------|------|\n",
    ]

    for path, methods in data.get("paths", {}).items():
        for method, info in methods.items():
            summary = info.get("summary", "")
            tags = ", ".join(info.get("tags", []))
            lines.append(f"| `{method.upper()}` | `{path}` | {summary} | {tags} |\n")

    OUTPUT_PATH.write_text("".join(lines), encoding="utf-8")
    print(f"✅ Generated: {OUTPUT_PATH.resolve()}")


if __name__ == "__main__":
    generate_table()
