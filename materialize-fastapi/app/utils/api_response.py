from collections.abc import Sequence

from app.schemas.api_response_schema import ApiErrorItem, ApiErrorResponse


def build_error_response(
    message: str,
    errors: Sequence[ApiErrorItem] | None = None,
) -> dict:
    payload = ApiErrorResponse(message=message, errors=list(errors or []))
    return payload.model_dump()


def map_validation_errors(raw_errors: Sequence[dict]) -> list[ApiErrorItem]:
    mapped: list[ApiErrorItem] = []
    for error in raw_errors:
        location = error.get("loc", ())
        field = ".".join(str(part) for part in location if part != "body") or None
        mapped.append(
            ApiErrorItem(
                field=field,
                code=error.get("type"),
                message=str(error.get("msg", "Invalid request")),
            )
        )
    return mapped


def map_http_detail_errors(detail: object) -> list[ApiErrorItem]:
    if not isinstance(detail, list):
        return []

    mapped: list[ApiErrorItem] = []
    for item in detail:
        if isinstance(item, dict):
            location = item.get("loc", ())
            field = ".".join(str(part) for part in location if part != "body") or None
            mapped.append(
                ApiErrorItem(
                    field=field,
                    code=item.get("type"),
                    message=str(item.get("msg", "Request error")),
                )
            )
        else:
            mapped.append(ApiErrorItem(message=str(item)))
    return mapped
