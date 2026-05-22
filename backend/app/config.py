from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:5173"
    APP_NAME: str = "NUP Diaspora Convention 2026 — Los Angeles"
    CONFERENCE_START_DATE: str = "2026-08-12"
    CONFERENCE_END_DATE: str = "2026-08-16"

    class Config:
        env_file = ".env"


settings = Settings()
