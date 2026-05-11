from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.security import HTTPBearer

from app.dependencies.auth_deps import get_auth_service
from app.schemas.user_schema import LoginSchema, TokenSchema, UserProfileSchema
from app.services.auth_service import AuthService
from app.utils.auth_util import clear_jwt_cookie, set_jwt_cookie

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


@router.post("/login", response_model=TokenSchema)
def login(
    payload: LoginSchema,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    """prameter menggunakan username `fmorrison@example.org` dan password `password123` untuk login"""
    token = auth_service.login(payload)
    set_jwt_cookie(response, token)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserProfileSchema)
def get_profile(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    subject = request.scope.get("user", {}).get("username")
    return auth_service.get_profile(subject)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_jwt_cookie(response)
    return response


# @router.get("/verify")
# def verify(request: Request, access_token: str = Cookie(None)):
#     auth_header = request.headers.get("Authorization")
#     if not auth_header:
#         raise HTTPException(status_code=401, detail="Missing Authorization header")

#     # Pastikan formatnya: Bearer <token>
#     if not auth_header.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Invalid token format")
#     token = auth_header.split(" ")[1]
#     username = verify_token(token)
#     if not username:
#         raise HTTPException(status_code=401, detail="Invalid token")
#     return {"username": username, "valid": True}
