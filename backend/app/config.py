from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:5173"
    APP_NAME: str = "NUP Diaspora Convention 2026 — Los Angeles"
    CONFERENCE_START_DATE: str = "2026-08-12"
    CONFERENCE_END_DATE: str = "2026-08-16"

    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None      # used for API calls to Stripe
    STRIPE_WEBHOOK_SECRET: Optional[str] = None  # used to verify incoming webhooks

    # Payment link IDs — copy from your Stripe Dashboard URLs (the part after buy.stripe.com/)
    # e.g. if the URL is buy.stripe.com/fZucN60BC3SKcLR9eYaR20j, the ID is fZucN60BC3SKcLR9eYaR20j
    STRIPE_LINK_CONVENTION_FULL: Optional[str] = None       # $300
    STRIPE_LINK_CONVENTION_HALF: Optional[str] = None       # $150
    STRIPE_LINK_BOAT_CRUISE_FULL: Optional[str] = None      # $220
    STRIPE_LINK_BOAT_CRUISE_PARTIAL: Optional[str] = None   # $110

    class Config:
        # .env.local overrides .env — use it for local dev without touching production values
        env_file = (".env", ".env.local")
        env_file_encoding = "utf-8"


settings = Settings()
