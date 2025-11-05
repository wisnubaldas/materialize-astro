from __future__ import annotations

import subprocess
import sys
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parent


def _run_mkdocs(*base_args: str) -> None:
    """Execute an MkDocs command and forward any extra CLI arguments."""
    extra_args = sys.argv[1:]
    command = ["mkdocs", *base_args, *extra_args]
    completed = subprocess.run(command, cwd=PROJECT_DIR, check=False)
    raise SystemExit(completed.returncode)


def run_dev() -> None:
    _run_mkdocs("serve")


def build_site() -> None:
    _run_mkdocs("build")


def run_prod() -> None:
    _run_mkdocs("serve", "--strict", "--no-livereload")
