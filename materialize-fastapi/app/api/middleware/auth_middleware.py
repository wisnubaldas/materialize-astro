from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.utils.env import ENV

# Daftar path yang tidak dicek token-nya
EXCLUDED_PATHS = ["/", "/auth/login", "/login", "/docs", "/openapi.json"]
def decode_token(token: str):
    try:
        payload = jwt.decode(token, ENV.SECRET_KEY, algorithms=[ENV.ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=e.msg)
    except JWTError as e:
        raise HTTPException(status_code=401, detail=e.msg)
class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Lewatkan semua OPTIONS request (preflight CORS)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Lewatkan path yang tidak perlu dicek token-nya
        if request.url.path in EXCLUDED_PATHS:
            return await call_next(request)

        # Ambil token dari header Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        token = auth_header.replace("Bearer ", "")
        try:
            payload = decode_token(token)
            # Inject ke scope (bisa diakses di route sebagai request.scope["user"])
            request.scope["user"] = {"username": payload.get("sub")}
        except Exception as e:
            return JSONResponse({"detail": str(e)}, status_code=401)

        return await call_next(request)
