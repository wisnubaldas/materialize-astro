# scripts/debug.py
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))  # tambahkan project root

from ptpython.repl import embed

from app.services.inv_ap2_service import INVAp2Service


def main():
    banner = """
🔍 FastAPI Debug Console
Kamu bisa langsung akses class & service di sini.
Contoh:
    INVAp2Service.get_data_inv()
    INVAp2Service.get_data_breakdown()
Ctrl+D untuk keluar.
"""
    # variabel yang otomatis tersedia di REPL
    vars = {
        "INVAp2Service": INVAp2Service,
    }

    embed(globals=vars, locals=vars, banner=banner)


if __name__ == "__main__":
    main()
