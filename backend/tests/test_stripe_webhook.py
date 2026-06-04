"""
Tests for the Stripe webhook endpoint (/api/webhooks/stripe).

Coverage:
  - All 4 payment link types (convention full/half, boat cruise full/partial)
  - Amount-based fallback classification when link IDs aren't matched
  - New registrant created automatically with QR code
  - Existing registrant updated (flags, no duplicate record)
  - Duplicate payment_intent ignored
  - Custom fields (Registrant's Name, City, State) parsed correctly
  - Invalid Stripe signature rejected (401)
  - Unpaid session ignored
  - Unknown event type ignored
  - Missing email handled gracefully
"""

import pytest
from app import models
from tests.conftest import make_checkout_event, post_webhook


# ---------------------------------------------------------------------------
# Happy path — all 4 payment types
# ---------------------------------------------------------------------------

class TestPaymentClassification:

    def test_convention_full_payment_creates_registrant(self, client, db_session):
        event = make_checkout_event(
            email="alice@example.com",
            stripe_name="Alice Smith",
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_conv_full_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        registrant = db_session.query(models.Registrant).filter_by(email="alice@example.com").first()
        assert registrant is not None
        assert registrant.convention is True
        assert registrant.boat_cruise is False
        assert registrant.first_name == "Alice"
        assert registrant.last_name == "Smith"
        assert registrant.qr_code is not None

        payment = db_session.query(models.Payment).filter_by(stripe_pi_id="pi_conv_full_001").first()
        assert payment is not None
        assert payment.product_type == "convention"
        assert payment.installment is None
        assert payment.amount == "300.00"

    def test_convention_half_payment(self, client, db_session):
        event = make_checkout_event(
            email="bob@example.com",
            amount_total=15000,
            payment_link="link_conv_half",
            payment_intent="pi_conv_half_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        payment = db_session.query(models.Payment).filter_by(stripe_pi_id="pi_conv_half_001").first()
        assert payment.product_type == "convention"
        assert payment.installment == 1
        assert payment.amount == "150.00"

        registrant = db_session.query(models.Registrant).filter_by(email="bob@example.com").first()
        assert registrant.convention is True

    def test_boat_cruise_full_payment(self, client, db_session):
        event = make_checkout_event(
            email="carol@example.com",
            amount_total=22000,
            payment_link="link_boat_full",
            payment_intent="pi_boat_full_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        payment = db_session.query(models.Payment).filter_by(stripe_pi_id="pi_boat_full_001").first()
        assert payment.product_type == "boat_cruise"
        assert payment.installment is None
        assert payment.amount == "220.00"

        registrant = db_session.query(models.Registrant).filter_by(email="carol@example.com").first()
        assert registrant.boat_cruise is True
        assert registrant.convention is False

    def test_boat_cruise_partial_payment(self, client, db_session):
        event = make_checkout_event(
            email="dan@example.com",
            amount_total=11000,
            payment_link="link_boat_partial",
            payment_intent="pi_boat_partial_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        payment = db_session.query(models.Payment).filter_by(stripe_pi_id="pi_boat_partial_001").first()
        assert payment.product_type == "boat_cruise"
        assert payment.installment == 1
        assert payment.amount == "110.00"


# ---------------------------------------------------------------------------
# Amount-based fallback (no link ID match)
# ---------------------------------------------------------------------------

class TestAmountFallback:

    def test_fallback_convention_full_by_amount(self, client, db_session):
        event = make_checkout_event(
            email="fallback@example.com",
            amount_total=30000,
            payment_link="unknown_link",
            payment_intent="pi_fallback_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        payment = db_session.query(models.Payment).filter_by(stripe_pi_id="pi_fallback_001").first()
        assert payment.product_type == "convention"
        assert payment.installment is None

    def test_fallback_boat_cruise_partial_by_amount(self, client, db_session):
        event = make_checkout_event(
            email="fallback2@example.com",
            amount_total=11000,
            payment_link="unknown_link",
            payment_intent="pi_fallback_002",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        payment = db_session.query(models.Payment).filter_by(stripe_pi_id="pi_fallback_002").first()
        assert payment.product_type == "boat_cruise"
        assert payment.installment == 1

    def test_unrecognised_amount_skipped(self, client, db_session):
        """An unknown amount with no link match should be silently skipped."""
        event = make_checkout_event(
            email="unknown@example.com",
            amount_total=99999,
            payment_link="unknown_link",
            payment_intent="pi_unknown_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        count = db_session.query(models.Registrant).count()
        assert count == 0


# ---------------------------------------------------------------------------
# Existing registrant
# ---------------------------------------------------------------------------

class TestExistingRegistrant:

    def test_payment_linked_to_existing_registrant(self, client, db_session):
        """If the email already exists, no duplicate registrant is created."""
        # Pre-seed a registrant
        existing = models.Registrant(
            first_name="Eve",
            last_name="Jones",
            email="eve@example.com",
            entered_by="admin",
        )
        db_session.add(existing)
        db_session.commit()
        db_session.refresh(existing)
        original_id = existing.id

        event = make_checkout_event(
            email="eve@example.com",
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_existing_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        db_session.expire_all()  # flush cached state — webhook ran in a separate session
        registrants = db_session.query(models.Registrant).filter_by(email="eve@example.com").all()
        assert len(registrants) == 1
        assert registrants[0].id == original_id
        assert registrants[0].convention is True

        payment = db_session.query(models.Payment).filter_by(stripe_pi_id="pi_existing_001").first()
        assert payment.registrant_id == original_id

    def test_existing_registrant_gets_boat_cruise_added(self, client, db_session):
        """A registrant already in the DB for convention can also get boat_cruise set."""
        existing = models.Registrant(
            first_name="Frank",
            last_name="Brown",
            email="frank@example.com",
            convention=True,
            entered_by="admin",
        )
        db_session.add(existing)
        db_session.commit()

        event = make_checkout_event(
            email="frank@example.com",
            amount_total=22000,
            payment_link="link_boat_full",
            payment_intent="pi_frank_boat_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        db_session.expire_all()
        registrant = db_session.query(models.Registrant).filter_by(email="frank@example.com").first()
        assert registrant.convention is True
        assert registrant.boat_cruise is True


# ---------------------------------------------------------------------------
# Duplicate prevention
# ---------------------------------------------------------------------------

class TestDuplicatePrevention:

    def test_duplicate_payment_intent_ignored(self, client, db_session):
        """Sending the same event twice should only create one payment record."""
        event = make_checkout_event(
            email="grace@example.com",
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_dup_001",
        )
        post_webhook(client, event)
        resp = post_webhook(client, event)  # second identical call
        assert resp.status_code == 200

        payments = db_session.query(models.Payment).filter_by(stripe_pi_id="pi_dup_001").all()
        assert len(payments) == 1

        registrants = db_session.query(models.Registrant).filter_by(email="grace@example.com").all()
        assert len(registrants) == 1


# ---------------------------------------------------------------------------
# Custom fields parsing
# ---------------------------------------------------------------------------

class TestCustomFields:

    def test_registrant_name_parsed_from_custom_fields(self, client, db_session):
        custom_fields = [
            {"key": "registrants_name", "text": {"value": "Henry Ford"}, "type": "text"},
            {"key": "city",             "text": {"value": "Detroit"},    "type": "text"},
            {"key": "state",            "text": {"value": "MI"},         "type": "text"},
        ]
        event = make_checkout_event(
            email="henry@example.com",
            stripe_name="H Ford",       # billing name — should be overridden
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_henry_001",
            custom_fields=custom_fields,
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        registrant = db_session.query(models.Registrant).filter_by(email="henry@example.com").first()
        assert registrant.first_name == "Henry"
        assert registrant.last_name == "Ford"
        assert registrant.city == "Detroit"
        assert registrant.state == "MI"

    def test_stripe_billing_name_used_as_fallback(self, client, db_session):
        """When no custom name field, fall back to Stripe billing name."""
        event = make_checkout_event(
            email="ivy@example.com",
            stripe_name="Ivy League",
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_ivy_001",
            custom_fields=[],
        )
        post_webhook(client, event)

        registrant = db_session.query(models.Registrant).filter_by(email="ivy@example.com").first()
        assert registrant.first_name == "Ivy"
        assert registrant.last_name == "League"


# ---------------------------------------------------------------------------
# Security & edge cases
# ---------------------------------------------------------------------------

class TestSecurity:

    def test_invalid_signature_rejected(self, client):
        import json
        payload = json.dumps(make_checkout_event()).encode()
        resp = client.post(
            "/api/webhooks/stripe",
            content=payload,
            headers={
                "stripe-signature": "t=123,v1=invalidsig",
                "content-type": "application/json",
            },
        )
        assert resp.status_code == 400

    def test_unpaid_session_ignored(self, client, db_session):
        event = make_checkout_event(
            email="unpaid@example.com",
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_unpaid_001",
            payment_status="unpaid",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        count = db_session.query(models.Registrant).count()
        assert count == 0

    def test_non_checkout_event_ignored(self, client, db_session):
        import json, time, hashlib, hmac
        from tests.conftest import TEST_WEBHOOK_SECRET, _sign_payload

        event = {"type": "payment_intent.created", "data": {"object": {}}}
        payload = json.dumps(event).encode()
        sig = _sign_payload(payload, TEST_WEBHOOK_SECRET)
        resp = client.post(
            "/api/webhooks/stripe",
            content=payload,
            headers={"stripe-signature": sig, "content-type": "application/json"},
        )
        assert resp.status_code == 200
        assert db_session.query(models.Registrant).count() == 0

    def test_missing_email_handled_gracefully(self, client, db_session):
        event = make_checkout_event(
            email="",
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_noemail_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200
        assert db_session.query(models.Registrant).count() == 0


# ---------------------------------------------------------------------------
# New registrant QR code
# ---------------------------------------------------------------------------

class TestQRCode:

    def test_new_registrant_gets_qr_code(self, client, db_session):
        event = make_checkout_event(
            email="qr@example.com",
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_qr_001",
        )
        post_webhook(client, event)

        registrant = db_session.query(models.Registrant).filter_by(email="qr@example.com").first()
        assert registrant.qr_code is not None
        assert len(registrant.qr_code) > 0
