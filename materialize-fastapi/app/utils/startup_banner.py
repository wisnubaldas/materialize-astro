from __future__ import annotations

import os
import platform
import socket
from datetime import datetime
from importlib import metadata
from shutil import get_terminal_size
from textwrap import dedent

from app.utils.env import ENV

ASCII_ART = dedent(
    r"""
$$$$$$$\            $$\       $$\                     
$$  __$$\           $$ |      $$ |                    
$$ |  $$ | $$$$$$\  $$ | $$$$$$$ | $$$$$$\   $$$$$$$\ 
$$$$$$$\ | \____$$\ $$ |$$  __$$ | \____$$\ $$  _____|
$$  __$$\  $$$$$$$ |$$ |$$ /  $$ | $$$$$$$ |\$$$$$$\  
$$ |  $$ |$$  __$$ |$$ |$$ |  $$ |$$  __$$ | \____$$\ 
$$$$$$$  |\$$$$$$$ |$$ |\$$$$$$$ |\$$$$$$$ |$$$$$$$  |
\_______/  \_______|\__| \_______| \_______|\_______/ 
                                                      
                                                      
                                                    
    """
).strip("\n")

PACKAGE_NAME = "fastapi-app"


def _fetch_version() -> str:
    try:
        return metadata.version(PACKAGE_NAME)
    except metadata.PackageNotFoundError:
        return "unknown"
    except Exception:  # pragma: no cover - defensive fallback
        return "unknown"


def _collect_details() -> list[tuple[str, str]]:
    now = datetime.now().astimezone()
    tz = now.tzname() or "local"
    env_name = getattr(ENV, "APP_ENV", "unknown")
    debug_enabled = "yes" if getattr(ENV, "APP_DEBUG", False) else "no"
    python_version = platform.python_version()
    arch = f"{platform.machine()} ({platform.processor() or 'generic'})"
    os_release = f"{platform.system()} {platform.release()}"
    hostname = socket.gethostname()
    cpu_count = os.cpu_count() or "unknown"
    terminal = os.environ.get("TERM") or os.environ.get("WT_SESSION") or "unknown"

    return [
        ("Project", f"{PACKAGE_NAME} v{_fetch_version()}"),
        ("Environment", f"{env_name} (debug {debug_enabled})"),
        ("Python", python_version),
        ("OS", f"{os_release}"),
        ("Arch", arch),
        ("Hostname", hostname),
        ("Cores", str(cpu_count)),
        ("Terminal", terminal),
        (
            "Started",
            now.strftime("%Y-%m-%d %H:%M:%S %Z")
            if tz != "local"
            else now.strftime("%Y-%m-%d %H:%M:%S"),
        ),
    ]


def _combine_art_and_info(art_lines: list[str], info_lines: list[str]) -> str:
    art_width = max(len(line) for line in art_lines) if art_lines else 0
    stop_padding = " " * 4
    rows = []

    for index in range(max(len(art_lines), len(info_lines))):
        art_segment = art_lines[index] if index < len(art_lines) else ""
        info_segment = info_lines[index] if index < len(info_lines) else ""
        rows.append(f"{art_segment.ljust(art_width)}{stop_padding}{info_segment}")

    return "\n".join(rows)


def print_startup_banner() -> None:
    details = _collect_details()
    key_width = max(len(key) for key, _ in details) if details else 0
    formatted_details = [f"{key:<{key_width}} : {value}" for key, value in details]
    art_lines = ASCII_ART.splitlines()
    terminal_width = get_terminal_size(fallback=(80, 20)).columns
    banner = _combine_art_and_info(art_lines, formatted_details)
    # Ensure the banner does not overflow badly; wrap if terminal is narrow.
    if terminal_width < len(max(banner.splitlines(), key=len)):
        banner = "\n".join(line[:terminal_width] for line in banner.splitlines())
    print(banner)
    print()
