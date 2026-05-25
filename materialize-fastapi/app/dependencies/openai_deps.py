"""Dependency injection untuk integrasi OpenAI."""

from app.services.openai_service import OpenAIHelloService, build_openai_hello_service


def get_openai_hello_service() -> OpenAIHelloService:
    """Sediakan service contoh OpenAI untuk route FastAPI.

    Returns:
        Instance OpenAIHelloService yang siap dipakai route.
    """

    return build_openai_hello_service()
