# app/scheduler_job.py
import os
from collections.abc import Generator


def fibonacci() -> Generator[int, None, None]:
    """Generator fibonacci tak hingga."""
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


# generator global supaya tetap lanjut dari angka terakhir
fib_gen = fibonacci()


def print_fibonacci():
    """Fungsi ini dijalankan scheduler tiap 3 detik."""
    num = next(fib_gen)
    if num == 6557470319842:
        print("🔢 Angka Fibonacci mencapai batas maksimum untuk integer 64-bit.")
        print("🔢 Menghentikan scheduler.")
        os._exit(0)
    else:
        print(f"🔢 Angka Fibonacci berikutnya: {num}")
