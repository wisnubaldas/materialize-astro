from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r
from app.models.BaseDB1.role import Role
from app.models.BaseDB1.user import User
from app.models.BaseDB1.user_role import UserRole
from app.schemas.user_schema import LoginSchema, TokenSchema, UserProfileSchema
from app.utils.auth_util import clear_jwt_cookie, create_token, set_jwt_cookie, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


@router.post("/login", response_model=TokenSchema)
def login(payload: LoginSchema, response: Response, db: Session = Depends(get_db1_r)):
    """prameter menggunakan username `fmorrison@example.org` dan password `password123` untuk login"""
    # Cari user berdasarkan username

    user = db.query(User).filter(User.email == payload.email).first()
    # Kalau user tidak ada atau password tidak cocok
    if not user or not verify_password(payload.password, user.password):  # type: ignore
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_token(user.email)  # type: ignore
    set_jwt_cookie(response, token)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserProfileSchema)
def get_profile(request: Request, db: Session = Depends(get_db1_r)):
    subject = request.scope.get("user", {}).get("username")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    user = (
        db.query(User)
        .filter(or_(User.email == subject, User.username == subject))
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan")

    roles = (
        db.query(Role.role_name)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user.id)
        .order_by(Role.role_name.asc())
        .all()
    )
    role_names = [item.role_name for item in roles]

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "roles": role_names,
    }


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
