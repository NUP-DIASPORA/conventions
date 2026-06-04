"""
Tests for /api/payments — create, link unattributed, summary, delete.
"""
import pytest
from tests.conftest import create_admin, get_auth_headers


@pytest.fixture
def auth(client, db_session):
    create_admin(db_session)
    return get_auth_headers(client)


@pytest.fixture
def registrant(client, auth):
    resp = client.post("/api/registrants", json={
        "first_name": "Bob", "last_name": "Jones",
        "email": "bob@example.com", "age_group": "adult",
    }, headers=auth)
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Create payment
# ---------------------------------------------------------------------------

class TestCreatePayment:

    def test_create_attributed_payment(self, client, auth, registrant):
        resp = client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "convention",
            "amount": "300.00",
        }, headers=auth)
        assert resp.status_code == 201
        body = resp.json()
        assert body["product_type"] == "convention"
        assert body["amount"] == "300.00"
        assert body["registrant_id"] == registrant["id"]

    def test_convention_payment_sets_flag(self, client, auth, registrant):
        client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "convention",
            "amount": "300.00",
        }, headers=auth)
        reg = client.get(f"/api/registrants/{registrant['id']}", headers=auth).json()
        assert reg["convention"] is True

    def test_boat_cruise_payment_sets_flag(self, client, auth, registrant):
        client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "boat_cruise",
            "amount": "220.00",
        }, headers=auth)
        reg = client.get(f"/api/registrants/{registrant['id']}", headers=auth).json()
        assert reg["boat_cruise"] is True

    def test_create_unattributed_payment(self, client, auth):
        resp = client.post("/api/payments", json={
            "product_type": "convention",
            "amount": "300.00",
            "payer_name": "Unknown Person",
        }, headers=auth)
        assert resp.status_code == 201
        assert resp.json()["registrant_id"] is None

    def test_create_partial_payment(self, client, auth, registrant):
        resp = client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "convention",
            "installment": 1,
            "amount": "150.00",
        }, headers=auth)
        assert resp.status_code == 201
        assert resp.json()["installment"] == 1

    def test_create_payment_invalid_registrant(self, client, auth):
        resp = client.post("/api/payments", json={
            "registrant_id": 99999,
            "product_type": "convention",
            "amount": "300.00",
        }, headers=auth)
        assert resp.status_code == 404

    def test_create_requires_auth(self, client):
        resp = client.post("/api/payments", json={
            "product_type": "convention", "amount": "300.00"
        })
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Unattributed payments
# ---------------------------------------------------------------------------

class TestUnattributedPayments:

    def test_list_unattributed(self, client, auth):
        # Create one unattributed, one attributed
        client.post("/api/payments", json={"product_type": "convention", "amount": "300.00"}, headers=auth)
        resp = client.get("/api/payments/unattributed", headers=auth)
        assert resp.status_code == 200
        assert all(p["registrant_id"] is None for p in resp.json())

    def test_link_unattributed_payment(self, client, auth, registrant):
        # Create unattributed
        p = client.post("/api/payments", json={
            "product_type": "boat_cruise", "amount": "220.00"
        }, headers=auth).json()
        pid = p["id"]

        # Link it
        resp = client.patch(
            f"/api/payments/{pid}/link",
            params={"registrant_id": registrant["id"]},
            headers=auth,
        )
        assert resp.status_code == 200
        assert resp.json()["registrant_id"] == registrant["id"]

        # boat_cruise flag should now be set
        reg = client.get(f"/api/registrants/{registrant['id']}", headers=auth).json()
        assert reg["boat_cruise"] is True

    def test_link_already_linked_payment_rejected(self, client, auth, registrant):
        p = client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "convention",
            "amount": "300.00",
        }, headers=auth).json()
        resp = client.patch(
            f"/api/payments/{p['id']}/link",
            params={"registrant_id": registrant["id"]},
            headers=auth,
        )
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

class TestPaymentSummary:

    def test_summary_totals(self, client, auth, registrant):
        client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "convention",
            "amount": "300.00",
        }, headers=auth)
        client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "boat_cruise",
            "amount": "220.00",
        }, headers=auth)

        resp = client.get("/api/payments/summary", headers=auth)
        assert resp.status_code == 200
        body = resp.json()
        assert body["convention"] == 300.0
        assert body["boat_cruise"] == 220.0
        assert body["total"] == 520.0

    def test_summary_full_vs_partial(self, client, auth, registrant):
        # Create second registrant with only a partial payment
        r2 = client.post("/api/registrants", json={
            "first_name": "Carol", "last_name": "X",
            "email": "carol@example.com", "age_group": "adult",
        }, headers=auth).json()

        # Full convention payment for registrant 1
        client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "convention", "amount": "300.00",
        }, headers=auth)
        # Partial convention payment for registrant 2
        client.post("/api/payments", json={
            "registrant_id": r2["id"],
            "product_type": "convention", "amount": "150.00",
        }, headers=auth)

        body = client.get("/api/payments/summary", headers=auth).json()
        assert body["convention_full"] == 1
        assert body["convention_partial"] == 1


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

class TestDeletePayment:

    def test_delete_payment(self, client, auth, registrant):
        p = client.post("/api/payments", json={
            "registrant_id": registrant["id"],
            "product_type": "convention", "amount": "300.00",
        }, headers=auth).json()
        resp = client.delete(f"/api/payments/{p['id']}", headers=auth)
        assert resp.status_code == 204

    def test_delete_nonexistent(self, client, auth):
        resp = client.delete("/api/payments/99999", headers=auth)
        assert resp.status_code == 404
