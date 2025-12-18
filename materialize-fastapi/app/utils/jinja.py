from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

BASE_DIR = Path(__file__).resolve().parent.parent

jinja_env = Environment(
    loader=FileSystemLoader(BASE_DIR / "templates"),
    autoescape=select_autoescape(["html", "xml"]),
    enable_async=False,
)

# Optional: global variables
jinja_env.globals.update(
    {
        "APP_NAME": "MAU APP",
    }
)
