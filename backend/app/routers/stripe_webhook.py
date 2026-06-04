"""
Stripe Webhook Handler
======================
Listens for checkout.session.completed events and automatically creates
or updates registrant records in the database.

Supported payment links:
  - Convention full payment ($300)
  - Convention half payment ($150)
  - Boat Cruise full payment ($220)
  - Boat Cruise partial payment ($110)

Setup:
  1. Add STRIPE_WEBHOOK_SECRET to your .env
  2. Add the 4 STRIPE_LINK_* IDs to your .env (see .env.example)
  3. In Stripe Dashboard → Developers → Webhooks, add your endpoint:
       https://<your-api-domain>/api/webhooks/stripe
     and subscribe to: checkout.session.completed
"""

import hashlib
import hmac
import json
import logging
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..config import settings
from ..utils.qr import generate_qr_code, get_registrant_qr_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

STRIPE_SIGNATURE_TOLERANCE = 300  # seconds (5 minutes — Stripe's default)


def _verify_stripe_signature(payload: bytes, sig_header: str | None, secret: str) -> bool:
    """
    Manually verify a Stripe webhook signature (same algorithm as the SDK).
    Returns True if valid, False otherwise.
    """
    if not sig_header:
        return False
    try:
        parts = {k: v for k, v in (p.split("=", 1) for p in sig_header.split(",") if "=" in p)}
        ts = int(parts.get("t", "0"))
        v1 = parts.get("v1", "")
    except Exception:
        return False

    # Reject timestamps too far in the past
    if abs(time.time() - ts) > STRIPE_SIGNATURE_TOLERANCE:
        return False

    signed_payload = f"{ts}.{payload.decode('utf-8')}"
    expected = hmac.new(secret.encode("utf-8"), signed_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, v1)


def _get_payment_link_id(session: dict) -> str | None:
    """Extract the payment link slug from a Stripe checkout session."""
    pl = session.get("payment_link")
    if not pl:
        return None
    # May be a string ID or an expanded object
    return pl if isinstance(pl, str) else pl.get("id")


def _classify_session(payment_link_id: str | None, amount_total: int) -> tuple[str, int | None] | None:
    """
    Return (product_type, installment) based on payment link ID.
    Falls back to amount if link IDs aren't configured.
    Returns None if the session can't be classified.

    installment: None = full payment, 1 = first/only partial payment
    """
    link_map = {
        settings.STRIPE_LINK_CONVENTION_FULL:    ("convention", None),
        settings.STRIPE_LINK_CONVENTION_HALF:    ("convention", 1),
        settings.STRIPE_LINK_BOAT_CRUISE_FULL:   ("boat_cruise", None),
        settings.STRIPE_LINK_BOAT_CRUISE_PARTIAL: ("boat_cruise", 1),
    }

    if payment_link_id:
        result = link_map.get(payment_link_id)
        if result:
            return result

    # Fallback: classify by amount (in cents)
    amount_map = {
        30000: ("convention", None),
        15000: ("convention", 1),
        22000: ("boat_cruise", None),
        11000: ("boat_cruise", 1),
    }
    return amount_map.get(amount_total)


def _parse_custom_fields(custom_fields: list) -> dict:
    """Pull City and State out of Stripe's custom_fields list."""
    result = {}
    for field in custom_fields:
        key = field.get("key", "").lower()
        text_val = (field.get("text") or {}).get("value") or \
                   (field.get("dropdown") or {}).get("value") or \
                   (field.get("numeric") or {}).get("value")
        if not text_val:
            continue
        if "city" in key:
            result["city"] = text_val
        elif "state" in key:
            result["state"] = text_val
        elif "name" in key or "registrant" in key:
            result["registrant_name"] = text_val
    return result


def _split_name(full_name: str) -> tuple[str, str]:
    """Split 'First Last' into ('First', 'Last'). Handles single names."""
    parts = full_name.strip().split(" ", 1)
    return parts[0], parts[1] if len(parts) > 1 else ""


@router.post("/stripe", status_code=200)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives Stripe webhook events and syncs payments to the database.
    Verifies the Stripe-Signature header to ensure authenticity.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET is not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    # Verify the Stripe webhook signature manually (HMAC-SHA256).
    # We avoid stripe.Webhook.construct_event because Stripe SDK v9 fails to parse
    # the event's "data.object" field — "object" is a Python builtin.
    if not _verify_stripe_signature(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET):
        logger.warning("Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        event = json.loads(payload)
    except (ValueError, json.JSONDecodeError):
        logger.warning("Invalid webhook payload")
        raise HTTPException(status_code=400, detail="Invalid payload")

    if event.get("type") != "checkout.session.completed":
        return {"received": True}

    session = event["data"]["object"]

    # Only process paid sessions
    if session.get("payment_status") != "paid":
        return {"received": True}

    try:
        _process_session(session, db)
    except Exception as e:
        logger.exception("Error processing webhook session %s: %s", session.get("id"), e)
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal error processing payment")

    return {"received": True}


def _process_session(session: dict, db: Session):
    """Core logic: upsert registrant + create payment record."""

    # --- Classify the payment ---
    payment_link_id = _get_payment_link_id(session)
    amount_total = session.get("amount_total", 0)  # in cents
    classification = _classify_session(payment_link_id, amount_total)

    if not classification:
        logger.warning(
            "Could not classify session %s (link=%s, amount=%s). Skipping.",
            session.get("id"), payment_link_id, amount_total
        )
        return

    product_type, installment = classification
    amount_dollars = f"{amount_total / 100:.2f}"

    # --- Extract customer info ---
    customer_details = session.get("customer_details") or {}
    email = (customer_details.get("email") or "").lower().strip()
    stripe_name = customer_details.get("name") or ""

    custom_fields = session.get("custom_fields") or []
    parsed = _parse_custom_fields(custom_fields)

    # Prefer the "Registrant's Name" custom field over Stripe's billing name
    registrant_name = parsed.get("registrant_name") or stripe_name
    first_name, last_name = _split_name(registrant_name) if registrant_name else ("", "")
    city = parsed.get("city")
    state = parsed.get("state")

    stripe_pi_id = session.get("payment_intent")
    paid_at = datetime.fromtimestamp(session.get("created", 0), tz=timezone.utc)

    if not email:
        logger.warning("No email in session %s — cannot create registrant", session.get("id"))
        return

    # --- Deduplicate: skip if this payment_intent is already recorded ---
    if stripe_pi_id:
        existing_payment = db.query(models.Payment).filter(
            models.Payment.stripe_pi_id == stripe_pi_id
        ).first()
        if existing_payment:
            logger.info("Payment %s already recorded. Skipping.", stripe_pi_id)
            return

    # --- Find or create registrant ---
    registrant = db.query(models.Registrant).filter(
        models.Registrant.email == email
    ).first()

    if registrant:
        # Update missing fields if we now have them
        if first_name and not registrant.first_name:
            registrant.first_name = first_name
        if last_name and not registrant.last_name:
            registrant.last_name = last_name
        if city and not registrant.city:
            registrant.city = city
        if state and not registrant.state:
            registrant.state = state
        logger.info("Found existing registrant id=%s for email=%s", registrant.id, email)
    else:
        registrant = models.Registrant(
            first_name=first_name or "Unknown",
            last_name=last_name,
            email=email,
            city=city,
            state=state,
            entered_by="stripe-webhook",
        )
        db.add(registrant)
        db.flush()  # get the ID before creating the QR

        qr_data = get_registrant_qr_data(registrant.id, registrant.email)
        registrant.qr_code = generate_qr_code(qr_data)
        logger.info("Created new registrant id=%s for email=%s", registrant.id, email)

    # --- Update registration flags ---
    if product_type == "convention":
        registrant.convention = True
    elif product_type == "boat_cruise":
        registrant.boat_cruise = True

    # --- Record the payment ---
    payment = models.Payment(
        registrant_id=registrant.id,
        product_type=product_type,
        installment=installment,
        amount=amount_dollars,
        stripe_pi_id=stripe_pi_id,
        paid_at=paid_at,
        notes=f"Auto-recorded via Stripe webhook (session {session.get('id')})",
    )
    db.add(payment)
    db.commit()

    logger.info(
        "Recorded %s payment of $%s for registrant %s (installment=%s)",
        product_type, amount_dollars, registrant.id, installment
    )
