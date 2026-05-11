from fastapi import HTTPException, status

from app.repositories.auth_repository import AuthRepository
from app.schemas.user_schema import LoginSchema
from app.utils.auth_util import create_token, verify_password


class AuthService:
    def __init__(self, repo: AuthRepository):
        self.repository = repo

    def login(self, payload: LoginSchema) -> str:
        user = self.repository.get_user_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password):  # type: ignore[arg-type]
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        subject = (user.email or "").strip()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email user tidak valid",
            )

        return create_token(subject)

    def get_profile(self, subject: str | None) -> dict:
        if not subject:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

        user = self.repository.get_user_by_subject(subject)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan")

        role_names = self.repository.get_role_names_by_user_id(user.id)
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": role_names,
        }
