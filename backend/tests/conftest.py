"""
Shared pytest fixtures for the NUP conventions backend test suite.

Run with a file-based SQLite so all sessions share the same database:

    DATABASE_URL="sqlite:////tmp/test_nup.db" SECRET_KEY="test" pytest tests/

SQLite :memory: does NOT work here because each connection gets its own
isolated database, causing "no such table" errors across sessions.
"""

import json
import time
import hashlib
import hmac
import pytest
from fastapi.testclient import TestClient

# app.database must be imported before app.main so we get the same engine instance
from app.database import Base, engine, SessionLocal, get_db
from app.main import app
from app import models  # noqa: F401 — ensures all models are registered

# ---------------------------------------------------------------------------
# Reuse the app's own engine (configured via DATABASE_URL env var).
# This avoids the two-engine problem where the app and tests use different
# in-memory SQLite databases.
# ---------------------------------------------------------------------------

def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def reset_db():
    """Drop and recreate all tables before every test for a clean slate."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


app.dependency_overrides[get_db] = override_get_db

# ---------------------------------------------------------------------------
# Test client
# ---------------------------------------------------------------------------

TEST_WEBHOOK_SECRET = "whsec_testsecret1234567890abcdef"

# ---------------------------------------------------------------------------
# Admin / auth helpers
# ---------------------------------------------------------------------------

ADMIN_EMAIL    = "admin@test.com"
ADMIN_PASSWORD = "testpassword123"


def create_admin(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, full_name="Test Admin"):
    """Insert an admin directly into the DB and return it."""
    from app.utils.auth import get_password_hash
    admin = models.Admin(
        email=email,
        full_name=full_name,
        hashed_password=get_password_hash(password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def get_auth_headers(client, email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    """Log in and return Bearer auth headers."""
    resp = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )
    assert resp.status_code == 200, f"Login failed: {resp.json()}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client(monkeypatch):
    """FastAPI test client with Stripe webhook secret patched in."""
    monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET)
    monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_LINK_CONVENTION_FULL",    "link_conv_full")
    monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_LINK_CONVENTION_HALF",    "link_conv_half")
    monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_LINK_BOAT_CRUISE_FULL",   "link_boat_full")
    monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_LINK_BOAT_CRUISE_PARTIAL","link_boat_partial")
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db_session():
    """Direct DB session for asserting state after webhook calls."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Stripe event / signature helpers
# ---------------------------------------------------------------------------

def _sign_payload(payload: bytes, secret: str) -> str:
    """Produce a valid Stripe-Signature header for the given payload."""
    ts = str(int(time.time()))
    signed_payload = f"{ts}.{payload.decode()}"
    sig = hmac.new(secret.encode(), signed_payload.encode(), hashlib.sha256).hexdigest()
    return f"t={ts},v1={sig}"


def make_checkout_event(
    *,
    email: str = "test@example.com",
    stripe_name: str = "Jane Doe",
    amount_total: int = 30000,           # cents
    payment_link: str = "link_conv_full",
    payment_intent: str = "pi_test_001",
    session_id: str = "cs_test_001",
    custom_fields: list | None = None,
    payment_status: str = "paid",
) -> dict:
    """Build a minimal checkout.session.completed event dict."""
    if custom_fields is None:
        custom_fields = []
    return {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": session_id,
                "object": "checkout.session",
                "payment_status": payment_status,
                "amount_total": amount_total,
                "payment_link": payment_link,
                "payment_intent": payment_intent,
                "created": int(time.time()),
                "customer_details": {
                    "email": email,
                    "name": stripe_name,
                },
                "custom_fields": custom_fields,
            }
        },
    }


def post_webhook(client, event: dict, secret: str = TEST_WEBHOOK_SECRET):
    """POST a signed Stripe event to the webhook endpoint."""
    payload = json.dumps(event).encode()
    sig = _sign_payload(payload, secret)
    return client.post(
        "/api/webhooks/stripe",
        content=payload,
        headers={
            "stripe-signature": sig,
            "content-type": "application/json",
        },
    )
