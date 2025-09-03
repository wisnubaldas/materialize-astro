from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.auth import create_token, verify_token
from app.db import SessionLocal
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()

@router.post("/login")
def login(username: str, password: str):
    db = SessionLocal()
    user = db.query(User).filter(User.username == username, User.password == password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.username)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    username = verify_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"username": username}
