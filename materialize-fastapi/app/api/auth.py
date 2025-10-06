from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r
from app.models.user import User
from app.schemas.user_schema import LoginSchema, TokenSchema
from app.utils.auth_util import create_token, set_jwt_cookie, verify_password, verify_token

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


@router.post("/login", response_model=TokenSchema)
def login(payload: LoginSchema, response: Response, db: Session = Depends(get_db1_r)):
    # Cari user berdasarkan username
    user = db.query(User).filter(User.email == payload.email).first()
    # Kalau user tidak ada atau password tidak cocok
    if not user or not verify_password(payload.password, user.password):  # type: ignore
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_token(user.email)  # type: ignore
    set_jwt_cookie(response, token)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/verify")
def verify(request: Request, access_token: str = Cookie(None)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    # Pastikan formatnya: Bearer <token>
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = auth_header.split(" ")[1]
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"username": username, "valid": True}
