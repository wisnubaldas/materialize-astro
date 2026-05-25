"""Schema request dan response untuk contoh integrasi OpenAI."""

from pydantic import BaseModel, Field


class OpenAIHelloRequest(BaseModel):
    """Payload untuk meminta sapaan sederhana dari OpenAI.

    Args:
        name: Nama opsional yang akan disapa oleh AI.
    """

    name: str = Field(default="AI", min_length=1, max_length=80)


class OpenAIHelloData(BaseModel):
    """Data hasil sapaan dari OpenAI.

    Args:
        prompt: Prompt akhir yang dikirim ke OpenAI.
        reply: Teks jawaban dari model.
        model: Nama model OpenAI yang digunakan.
    """

    prompt: str
    reply: str
    model: str


class OpenAIHelloResponse(BaseModel):
    """Response standar untuk endpoint contoh sapaan OpenAI.

    Args:
        status: Status response API.
        message: Pesan ringkas untuk client.
        data: Data hasil pemanggilan OpenAI.
    """

    status: str = "success"
    message: str = "OpenAI berhasil menyapa."
    data: OpenAIHelloData
