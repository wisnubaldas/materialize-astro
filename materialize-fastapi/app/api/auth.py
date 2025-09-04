from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.auth_util import create_token, verify_token, verify_password
from sqlalchemy.orm import Session
from app.db.mysql import get_db
from app.models.user import User
from app.schemas.user_schema import LoginSchema, TokenSchema

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()

@router.post("/login",response_model=TokenSchema)
def login(payload: LoginSchema,db: Session = Depends(get_db)):
    # Cari user berdasarkan username
    user = db.query(User).filter(User.email == payload.email).first()
    # Kalau user tidak ada atau password tidak cocok
    if not user or not verify_password(payload.password, user.password): # type: ignore
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    token = create_token(user.email) # type: ignore
    return {"access_token": token, "token_type": "bearer"}

@router.get("/verify")
def verify(authorization: str = Header(...)):
    """
    Verifikasi JWT token dari header Authorization: Bearer <token>
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )

    token = authorization.split(" ")[1]
    username = verify_token(token)

    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return {"username": username, "valid": True}
@router.post("/logout")
def logout():
    """
    Logout JWT-based auth (stateless).
    Client harus hapus token dari cookie/localStorage.
    """
    return {"message": "Successfully logged out"}
