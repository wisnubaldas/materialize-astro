"""Script terminal untuk mencoba OpenAI API secara sederhana.

Contoh eksekusi:
    poetry run python scripts/openai_hello_test.py --name AI
"""

import argparse
import asyncio
import os

from dotenv import load_dotenv
from openai import (
    APIConnectionError,
    APIError,
    APITimeoutError,
    AsyncOpenAI,
    AuthenticationError,
    OpenAIError,
    RateLimitError,
)


def _get_openai_api_key() -> str | None:
    """Ambil API key OpenAI dari environment tanpa mencetak nilainya.

    Returns:
        Nilai API key jika tersedia, atau None jika belum dikonfigurasi.
    """

    return os.getenv("OPENAI_API_KEY") or os.getenv("OPEN_AI_API_KEY")


def _build_parser() -> argparse.ArgumentParser:
    """Bangun parser argumen CLI untuk script percobaan OpenAI.

    Returns:
        Parser argumen siap pakai.
    """

    parser = argparse.ArgumentParser(description="Coba OpenAI API dengan prompt Hai AI.")
    parser.add_argument("--name", default="AI", help="Nama yang akan disapa.")
    parser.add_argument(
        "--model",
        default=os.getenv("OPENAI_MODEL", "gpt-5.2"),
        help="Model OpenAI yang digunakan.",
    )
    parser.add_argument(
        "--timeout",
        default=float(os.getenv("OPENAI_TIMEOUT", "30")),
        type=float,
        help="Timeout request ke OpenAI dalam detik.",
    )
    return parser


async def _run_hello(name: str, model: str, timeout: float) -> int:
    """Kirim prompt sapaan ke OpenAI dan tampilkan hasilnya di terminal.

    Args:
        name: Nama penerima sapaan.
        model: Model OpenAI yang digunakan.
        timeout: Timeout request dalam detik.

    Returns:
        Exit code proses.
    """

    api_key = _get_openai_api_key()
    if not api_key:
        print("ERROR: OPENAI_API_KEY belum diset di environment atau file .env.")
        print("Tambahkan OPENAI_API_KEY=<key> di materialize-fastapi/.env.")
        return 1

    prompt = f"Sapa dengan singkat dalam Bahasa Indonesia: Hai {name}."
    client = AsyncOpenAI(api_key=api_key, timeout=timeout)

    try:
        response = await client.responses.create(model=model, input=prompt)
    except OpenAIError as exc:
        return _print_openai_error(exc)

    print("SUCCESS: OpenAI API berhasil merespons.")
    print(f"Model : {model}")
    print(f"Prompt: {prompt}")
    print(f"Reply : {response.output_text}")
    return 0


def _print_openai_error(exc: OpenAIError) -> int:
    """Tampilkan error OpenAI dengan pesan terminal yang mudah ditindaklanjuti.

    Args:
        exc: Exception dari OpenAI SDK.

    Returns:
        Exit code gagal.
    """

    if isinstance(exc, AuthenticationError):
        print("ERROR: API key OpenAI tidak valid atau tidak punya akses ke project/model.")
    elif isinstance(exc, RateLimitError):
        error_body = getattr(exc, "body", None)
        error_code = None
        if isinstance(error_body, dict):
            error_code = error_body.get("code") or error_body.get("error", {}).get("code")

        print("ERROR: OpenAI mengembalikan 429 Too Many Requests.")
        if error_code == "insufficient_quota":
            print("Penyebab: quota/billing OpenAI project belum aktif atau sudah habis.")
            print(
                "Solusi: cek Billing dan Usage di https://platform.openai.com/settings/organization/billing"
            )
        else:
            print("Penyebab: rate limit sementara. Coba ulang beberapa saat lagi.")
    elif isinstance(exc, (APIConnectionError, APITimeoutError)):
        print("ERROR: Gagal terhubung ke OpenAI atau request timeout.")
    elif isinstance(exc, APIError):
        print(f"ERROR: OpenAI API gagal memproses request. Status: {exc.status_code}")
    else:
        print(f"ERROR: OpenAI SDK error: {exc.__class__.__name__}")

    return 1


def main() -> int:
    """Entry point script terminal.

    Returns:
        Exit code proses.
    """

    load_dotenv()
    parser = _build_parser()
    args = parser.parse_args()
    return asyncio.run(_run_hello(name=args.name, model=args.model, timeout=args.timeout))


if __name__ == "__main__":
    raise SystemExit(main())
