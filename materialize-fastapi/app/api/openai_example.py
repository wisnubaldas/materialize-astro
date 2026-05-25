"""Route contoh untuk mencoba OpenAI API dari backend."""

from fastapi import APIRouter, Depends

from app.dependencies.openai_deps import get_openai_hello_service
from app.schemas.openai_schema import OpenAIHelloRequest, OpenAIHelloResponse
from app.services.openai_service import OpenAIHelloService

router = APIRouter(prefix="/openai", tags=["OpenAI"])


@router.post("/hello", response_model=OpenAIHelloResponse, summary="Contoh sapaan OpenAI")
async def hello_ai(
    payload: OpenAIHelloRequest,
    service: OpenAIHelloService = Depends(get_openai_hello_service),
) -> OpenAIHelloResponse:
    """Generate contoh sapaan sederhana menggunakan OpenAI API.

    Args:
        payload: Request berisi nama yang akan disapa.
        service: Service OpenAI dari dependency injection.

    Returns:
        Response standar berisi hasil sapaan dari OpenAI.
    """

    data = await service.say_hello(payload.name)
    return OpenAIHelloResponse(data=data)
