"""Service untuk integrasi sederhana dengan OpenAI API."""

import logging

from fastapi import HTTPException, status
from openai import APIConnectionError, APIError, APITimeoutError, AsyncOpenAI, AuthenticationError

from app.schemas.openai_schema import OpenAIHelloData
from app.utils.env import ENV

logger = logging.getLogger(__name__)


class OpenAIHelloService:
    """Service contoh untuk menghasilkan sapaan memakai OpenAI Responses API.

    Args:
        client: Async client resmi OpenAI.
        model: Nama model OpenAI yang digunakan.
    """

    def __init__(self, client: AsyncOpenAI, model: str) -> None:
        self.client = client
        self.model = model

    async def say_hello(self, name: str) -> OpenAIHelloData:
        """Generate sapaan singkat untuk nama yang dikirim client.

        Args:
            name: Nama penerima sapaan.

        Returns:
            Data sapaan berisi prompt, jawaban model, dan model yang dipakai.
        """

        prompt = f"Sapa dengan singkat dalam Bahasa Indonesia: Hai {name}."

        try:
            response = await self.client.responses.create(
                model=self.model,
                input=prompt,
            )
        except AuthenticationError as exc:
            logger.warning("OpenAI API key tidak valid atau tidak memiliki akses model.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Konfigurasi OpenAI tidak valid atau model tidak bisa diakses.",
            ) from exc
        except (APIConnectionError, APITimeoutError) as exc:
            logger.warning("Koneksi ke OpenAI gagal.", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gagal terhubung ke layanan OpenAI.",
            ) from exc
        except APIError as exc:
            logger.warning("OpenAI API mengembalikan error.", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="OpenAI API gagal memproses permintaan.",
            ) from exc

        return OpenAIHelloData(
            prompt=prompt,
            reply=response.output_text,
            model=self.model,
        )


def build_openai_hello_service() -> OpenAIHelloService:
    """Bangun service OpenAI dengan konfigurasi dari environment.

    Returns:
        Instance service contoh OpenAI.
    """

    if not ENV.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY belum dikonfigurasi di environment backend.",
        )

    client = AsyncOpenAI(
        api_key=ENV.OPENAI_API_KEY,
        timeout=ENV.OPENAI_TIMEOUT,
    )
    return OpenAIHelloService(client=client, model=ENV.OPENAI_MODEL)
