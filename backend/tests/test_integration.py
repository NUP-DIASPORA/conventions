"""
End-to-end integration tests.

These tests exercise full user journeys across multiple routers, verifying
that the pieces work together correctly.
"""
import pytest
from tests.conftest import create_admin, get_auth_headers, make_checkout_event, post_webhook, TEST_WEBHOOK_SECRET


@pytest.fixture
def auth(client, db_session):
    create_admin(db_session)
    return get_auth_headers(client)


# ---------------------------------------------------------------------------
# Journey 1: Admin registers a delegate manually → pays → checks in
# ---------------------------------------------------------------------------

class TestManualRegistrationFlow:

    def test_register_pay_checkin(self, client, auth):
        # 1. Create registrant
        reg = client.post("/api/registrants", json={
            "first_name": "Grace",
            "last_name": "Hopper",
            "email": "grace@example.com",
            "age_group": "adult",
        }, headers=auth).json()
        assert reg["convention"] is False
        assert reg["qr_code"] is not None

        # 2. Record convention payment
        payment = client.post("/api/payments", json={
            "registrant_id": reg["id"],
            "product_type": "convention",
            "amount": "300.00",
            "stripe_pi_id": "pi_grace_001",
        }, headers=auth).json()
        assert payment["product_type"] == "convention"

        # 3. Confirm flag is set
        reg_updated = client.get(f"/api/registrants/{reg['id']}", headers=auth).json()
        assert reg_updated["convention"] is True

        # 4. Check in on day 1
        checkin = client.post("/api/checkins", json={
            "registrant_id": reg["id"],
            "event_type": "convention",
            "conference_day": 1,
        }, headers=auth).json()
        assert checkin["event_type"] == "convention"

        # 5. Confirm checked_in flag
        reg_final = client.get(f"/api/registrants/{reg['id']}", headers=auth).json()
        assert reg_final["checked_in"] is True

        # 6. Stats reflect the check-in
        stats = client.get("/api/checkins/stats", headers=auth).json()
        assert stats["convention_checkins"] == 1


# ---------------------------------------------------------------------------
# Journey 2: Stripe webhook creates registrant → admin looks them up
# ---------------------------------------------------------------------------

class TestWebhookToAdminFlow:

    def test_webhook_creates_registrant_visible_in_admin(self, client, auth, monkeypatch):
        monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET)
        monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_LINK_CONVENTION_FULL", "link_conv_full")
        monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_LINK_CONVENTION_HALF", "link_conv_half")
        monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_LINK_BOAT_CRUISE_FULL", "link_boat_full")
        monkeypatch.setattr("app.routers.stripe_webhook.settings.STRIPE_LINK_BOAT_CRUISE_PARTIAL", "link_boat_partial")

        event = make_checkout_event(
            email="stripe@example.com",
            stripe_name="Stripe User",
            amount_total=30000,
            payment_link="link_conv_full",
            payment_intent="pi_integration_001",
        )
        resp = post_webhook(client, event)
        assert resp.status_code == 200

        # Admin can find them by email
        reg = client.get("/api/registrants/by-email?email=stripe@example.com", headers=auth).json()
        assert reg["convention"] is True
        assert len(reg["payments"]) == 1
        assert reg["payments"][0]["stripe_pi_id"] == "pi_integration_001"


# ---------------------------------------------------------------------------
# Journey 3: Partial payment then second payment completes registration
# ---------------------------------------------------------------------------

class TestPartialThenFullPayment:

    def test_two_partial_payments_total_correct(self, client, auth):
        reg = client.post("/api/registrants", json={
            "first_name": "Henry", "last_name": "Ford",
            "email": "henry@example.com", "age_group": "adult",
        }, headers=auth).json()

        # First half
        client.post("/api/payments", json={
            "registrant_id": reg["id"],
            "product_type": "convention",
            "installment": 1,
            "amount": "150.00",
        }, headers=auth)

        # Second half
        client.post("/api/payments", json={
            "registrant_id": reg["id"],
            "product_type": "convention",
            "installment": 2,
            "amount": "150.00",
        }, headers=auth)

        summary = client.get("/api/payments/summary", headers=auth).json()
        assert summary["convention"] == 300.0
        # Combined $300 should count as full payment
        assert summary["convention_full"] == 1
        assert summary["convention_partial"] == 0


# ---------------------------------------------------------------------------
# Journey 4: Unattributed Stripe payment → admin links it manually
# ---------------------------------------------------------------------------

class TestUnattributedPaymentFlow:

    def test_unattributed_linked_to_registrant(self, client, auth):
        # Registrant exists
        reg = client.post("/api/registrants", json={
            "first_name": "Ivy", "last_name": "Green",
            "email": "ivy@example.com", "age_group": "adult",
        }, headers=auth).json()

        # Payment arrives but can't be attributed yet
        payment = client.post("/api/payments", json={
            "product_type": "boat_cruise",
            "amount": "220.00",
            "payer_name": "Ivy Green",
            "stripe_pi_id": "pi_unattr_001",
        }, headers=auth).json()
        assert payment["registrant_id"] is None

        # Admin links it
        linked = client.patch(
            f"/api/payments/{payment['id']}/link",
            params={"registrant_id": reg["id"]},
            headers=auth,
        ).json()
        assert linked["registrant_id"] == reg["id"]

        # Boat cruise flag now set
        reg_updated = client.get(f"/api/registrants/{reg['id']}", headers=auth).json()
        assert reg_updated["boat_cruise"] is True


# ---------------------------------------------------------------------------
# Journey 5: Full convention week check-ins (4 days)
# ---------------------------------------------------------------------------

class TestMultiDayCheckIn:

    def test_checkin_each_day(self, client, auth):
        reg = client.post("/api/registrants", json={
            "first_name": "Jack", "last_name": "Ma",
            "email": "jack@example.com", "age_group": "adult",
            "convention": True,
        }, headers=auth).json()

        # Check in on days 1–4 — convention only allows one check-in total
        r1 = client.post("/api/checkins", json={
            "registrant_id": reg["id"],
            "event_type": "convention",
            "conference_day": 1,
        }, headers=auth)
        assert r1.status_code == 201

        # Second check-in attempt on a different day still rejected
        r2 = client.post("/api/checkins", json={
            "registrant_id": reg["id"],
            "event_type": "convention",
            "conference_day": 2,
        }, headers=auth)
        assert r2.status_code == 400
