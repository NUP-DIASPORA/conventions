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

    # Payment link IDs — use the plink_… ID from Stripe Dashboard → Payment Links → open the link
    # (URL looks like dashboard.stripe.com/payment-links/plink_xxx). Do NOT use the buy.stripe.com slug;
    # checkout.session.completed sends payment_link as plink_…, not the public URL slug.
    # Amount-based fallback still works if these are unset or mismatched.
    STRIPE_LINK_CONVENTION_FULL: Optional[str] = None       # $300
    STRIPE_LINK_CONVENTION_HALF: Optional[str] = None       # $150
    STRIPE_LINK_CONVENTION_CHILDREN: Optional[str] = None   # $150 child/youth registration
    STRIPE_LINK_BOAT_CRUISE_FULL: Optional[str] = None      # $220
    STRIPE_LINK_BOAT_CRUISE_PARTIAL: Optional[str] = None   # $110
    STRIPE_LINK_VENDOR: Optional[str] = None                # $500 vendor table

    # When true, mutating API methods are blocked (safe prod browsing from local)
    READ_ONLY: bool = False

    class Config:
        # .env.local overrides .env — use it for local dev without touching production values
        env_file = (".env", ".env.local")
        env_file_encoding = "utf-8"


settings = Settings()
