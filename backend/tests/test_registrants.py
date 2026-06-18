"""
Tests for /api/registrants — CRUD, search, QR lookup, audit history.
"""
import pytest
from tests.conftest import create_admin, get_auth_headers


REGISTRANT_BASE = {
    "first_name": "Alice",
    "last_name": "Smith",
    "email": "alice@example.com",
    "phone": "555-1234",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "age_group": "adult",
    "convention": True,
    "boat_cruise": False,
}


@pytest.fixture
def auth(client, db_session):
    create_admin(db_session)
    return get_auth_headers(client)


@pytest.fixture
def registrant(client, auth):
    """Create a registrant and return the response body."""
    resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class TestCreateRegistrant:

    def test_create_success(self, client, auth):
        resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == "alice@example.com"
        assert body["convention"] is True
        assert body["qr_code"] is not None

    def test_create_generates_qr_code(self, client, auth):
        resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        assert resp.json()["qr_code"] is not None
        assert len(resp.json()["qr_code"]) > 100  # base64 QR is always long

    def test_create_duplicate_email_rejected(self, client, auth):
        client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        assert resp.status_code == 400

    def test_create_with_inline_payment(self, client, auth):
        payload = {**REGISTRANT_BASE, "payments": [{
            "product_type": "convention",
            "amount": "300.00",
            "stripe_pi_id": "pi_test_001",
        }]}
        resp = client.post("/api/registrants", json=payload, headers=auth)
        assert resp.status_code == 201
        assert len(resp.json()["payments"]) == 1
        assert resp.json()["payments"][0]["amount"] == "300.00"

    def test_create_requires_auth(self, client):
        resp = client.post("/api/registrants", json=REGISTRANT_BASE)
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# List & search
# ---------------------------------------------------------------------------

class TestListRegistrants:

    def test_list_all(self, client, auth, registrant):
        resp = client.get("/api/registrants", headers=auth)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_search_by_name(self, client, auth, registrant):
        resp = client.get("/api/registrants?search=Alice", headers=auth)
        assert any(r["email"] == "alice@example.com" for r in resp.json())

    def test_search_by_email(self, client, auth, registrant):
        resp = client.get("/api/registrants?search=alice@example", headers=auth)
        assert len(resp.json()) == 1

    def test_filter_by_convention(self, client, auth):
        # Convention registrant
        client.post("/api/registrants", json={**REGISTRANT_BASE, "convention": True}, headers=auth)
        # Boat cruise only registrant
        client.post("/api/registrants", json={
            **REGISTRANT_BASE, "email": "bob@example.com",
            "convention": False, "boat_cruise": True
        }, headers=auth)

        resp = client.get("/api/registrants?convention=true", headers=auth)
        assert all(r["convention"] for r in resp.json())

    def test_filter_by_boat_cruise(self, client, auth):
        client.post("/api/registrants", json={**REGISTRANT_BASE, "boat_cruise": True}, headers=auth)
        client.post("/api/registrants", json={
            **REGISTRANT_BASE, "email": "noboat@example.com", "boat_cruise": False
        }, headers=auth)
        resp = client.get("/api/registrants?boat_cruise=true", headers=auth)
        assert all(r["boat_cruise"] for r in resp.json())

    def test_list_requires_auth(self, client):
        assert client.get("/api/registrants").status_code == 401


# ---------------------------------------------------------------------------
# Get single
# ---------------------------------------------------------------------------

class TestGetRegistrant:

    def test_get_by_id(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.get(f"/api/registrants/{rid}", headers=auth)
        assert resp.status_code == 200
        assert resp.json()["id"] == rid

    def test_get_nonexistent(self, client, auth):
        resp = client.get("/api/registrants/99999", headers=auth)
        assert resp.status_code == 404

    def test_get_by_email(self, client, auth, registrant):
        resp = client.get(f"/api/registrants/by-email?email=alice@example.com", headers=auth)
        assert resp.status_code == 200
        assert resp.json()["email"] == "alice@example.com"

    def test_get_by_email_not_found(self, client, auth):
        resp = client.get("/api/registrants/by-email?email=nobody@example.com", headers=auth)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class TestUpdateRegistrant:

    def test_update_name(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.patch(f"/api/registrants/{rid}", json={"first_name": "Alicia"}, headers=auth)
        assert resp.status_code == 200
        assert resp.json()["first_name"] == "Alicia"

    def test_update_creates_audit_log(self, client, auth, registrant):
        rid = registrant["id"]
        client.patch(f"/api/registrants/{rid}", json={"first_name": "Alicia"}, headers=auth)
        resp = client.get(f"/api/registrants/{rid}/history", headers=auth)
        assert resp.status_code == 200
        logs = resp.json()
        assert any(l["field"] == "first_name" for l in logs)

    def test_update_email_conflict_rejected(self, client, auth, registrant):
        # Create second registrant
        client.post("/api/registrants", json={**REGISTRANT_BASE, "email": "bob@example.com"}, headers=auth)
        rid = registrant["id"]
        resp = client.patch(f"/api/registrants/{rid}", json={"email": "bob@example.com"}, headers=auth)
        assert resp.status_code == 400

    def test_update_nonexistent(self, client, auth):
        resp = client.patch("/api/registrants/99999", json={"first_name": "X"}, headers=auth)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

class TestDeleteRegistrant:

    def test_delete_success(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.delete(f"/api/registrants/{rid}", headers=auth)
        assert resp.status_code == 204
        assert client.get(f"/api/registrants/{rid}", headers=auth).status_code == 404

    def test_delete_nonexistent(self, client, auth):
        resp = client.delete("/api/registrants/99999", headers=auth)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# QR code
# ---------------------------------------------------------------------------

class TestQRCode:

    def test_get_qr_code(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.get(f"/api/registrants/{rid}/qr", headers=auth)
        assert resp.status_code == 200
        assert resp.json()["qr_code"] is not None

    def test_lookup_by_qr(self, client, auth, registrant):
        rid = registrant["id"]
        email = registrant["email"]
        qr_data = f"NUP:{rid}:{email}"
        resp = client.get(f"/api/registrants/lookup/by-qr?qr_data={qr_data}", headers=auth)
        assert resp.status_code == 200
        assert resp.json()["id"] == rid

    def test_lookup_by_qr_invalid_format(self, client, auth):
        resp = client.get("/api/registrants/lookup/by-qr?qr_data=badformat", headers=auth)
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Soft-delete behaviour
# ---------------------------------------------------------------------------

class TestSoftDelete:

    def test_deleted_hidden_from_list(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        ids = [r["id"] for r in client.get("/api/registrants", headers=auth).json()]
        assert rid not in ids

    def test_deleted_returns_404_on_get(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        assert client.get(f"/api/registrants/{rid}", headers=auth).status_code == 404

    def test_deleted_returns_404_on_update(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        assert client.patch(f"/api/registrants/{rid}", json={"first_name": "X"}, headers=auth).status_code == 404

    def test_deleted_returns_404_on_qr(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        assert client.get(f"/api/registrants/{rid}/qr", headers=auth).status_code == 404

    def test_deleted_hidden_from_by_email(self, client, auth, registrant):
        client.delete(f"/api/registrants/{registrant['id']}", headers=auth)
        resp = client.get("/api/registrants/by-email?email=alice@example.com", headers=auth)
        assert resp.status_code == 404

    def test_email_reusable_after_delete(self, client, auth, registrant):
        client.delete(f"/api/registrants/{registrant['id']}", headers=auth)
        resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        assert resp.status_code == 201

    def test_deleted_email_not_blocked_on_update(self, client, auth, registrant):
        """Updating another registrant's email to a soft-deleted email should succeed."""
        client.delete(f"/api/registrants/{registrant['id']}", headers=auth)
        other = client.post("/api/registrants", json={**REGISTRANT_BASE, "email": "other@example.com"}, headers=auth).json()
        resp = client.patch(f"/api/registrants/{other['id']}", json={"email": "alice@example.com"}, headers=auth)
        assert resp.status_code == 200

    def test_get_deleted_registrants_endpoint(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        resp = client.get("/api/registrants/deleted", headers=auth)
        assert resp.status_code == 200
        ids = [r["id"] for r in resp.json()]
        assert rid in ids

    def test_deleted_endpoint_excludes_active(self, client, auth, registrant):
        resp = client.get("/api/registrants/deleted", headers=auth)
        ids = [r["id"] for r in resp.json()]
        assert registrant["id"] not in ids

    def test_deleted_registrant_has_deleted_at(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        deleted = client.get("/api/registrants/deleted", headers=auth).json()
        match = next(r for r in deleted if r["id"] == rid)
        assert match["deleted_at"] is not None

    def test_cannot_checkin_deleted_registrant(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        resp = client.post("/api/checkins", json={"registrant_id": rid, "event_type": "convention"}, headers=auth)
        assert resp.status_code == 404

    def test_cannot_add_payment_to_deleted_registrant(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        resp = client.post("/api/payments", json={
            "registrant_id": rid, "product_type": "convention", "amount": "300.00"
        }, headers=auth)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------

class TestAuditLogging:

    def test_create_logs_created_entry(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.get(f"/api/registrants/{rid}/history", headers=auth)
        logs = resp.json()
        assert any(l["field"] == "[created]" for l in logs)

    def test_create_audit_entry_contains_name_and_email(self, client, auth, registrant):
        rid = registrant["id"]
        logs = client.get(f"/api/registrants/{rid}/history", headers=auth).json()
        created = next(l for l in logs if l["field"] == "[created]")
        assert "alice@example.com" in created["new_value"]

    def test_delete_logs_deleted_entry(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        logs = client.get(f"/api/registrants/{rid}/history", headers=auth).json()
        assert any(l["field"] == "[deleted]" for l in logs)

    def test_delete_audit_entry_contains_name(self, client, auth, registrant):
        rid = registrant["id"]
        client.delete(f"/api/registrants/{rid}", headers=auth)
        logs = client.get(f"/api/registrants/{rid}/history", headers=auth).json()
        deleted = next(l for l in logs if l["field"] == "[deleted]")
        assert "Alice" in deleted["old_value"]

    def test_payment_added_creates_audit_entry(self, client, auth, registrant):
        rid = registrant["id"]
        client.post("/api/payments", json={
            "registrant_id": rid, "product_type": "convention", "amount": "150.00"
        }, headers=auth)
        logs = client.get(f"/api/registrants/{rid}/history", headers=auth).json()
        assert any(l["field"] == "payment_added" for l in logs)

    def test_payment_removed_creates_audit_entry(self, client, auth, registrant):
        rid = registrant["id"]
        payment = client.post("/api/payments", json={
            "registrant_id": rid, "product_type": "convention", "amount": "150.00"
        }, headers=auth).json()
        client.delete(f"/api/payments/{payment['id']}", headers=auth)
        logs = client.get(f"/api/registrants/{rid}/history", headers=auth).json()
        assert any(l["field"] == "payment_removed" for l in logs)

    def test_payment_linked_creates_audit_entry(self, client, auth, registrant):
        rid = registrant["id"]
        # Create unattributed payment
        payment = client.post("/api/payments", json={
            "product_type": "convention", "amount": "300.00"
        }, headers=auth).json()
        # Link it
        client.patch(f"/api/payments/{payment['id']}/link?registrant_id={rid}", headers=auth)
        logs = client.get(f"/api/registrants/{rid}/history", headers=auth).json()
        assert any(l["field"] == "payment_linked" for l in logs)


# ---------------------------------------------------------------------------
# Stats exclude deleted registrants
# ---------------------------------------------------------------------------

class TestStatsExcludeDeleted:

    def test_total_registrants_excludes_deleted(self, client, auth, registrant):
        before = client.get("/api/checkins/stats", headers=auth).json()["total_registrants"]
        client.delete(f"/api/registrants/{registrant['id']}", headers=auth)
        after = client.get("/api/checkins/stats", headers=auth).json()["total_registrants"]
        assert after == before - 1

    def test_convention_count_excludes_deleted(self, client, auth, registrant):
        # registrant has convention=True
        before = client.get("/api/checkins/stats", headers=auth).json()["convention_registrants"]
        client.delete(f"/api/registrants/{registrant['id']}", headers=auth)
        after = client.get("/api/checkins/stats", headers=auth).json()["convention_registrants"]
        assert after == before - 1

    def test_boat_cruise_count_excludes_deleted(self, client, auth):
        cruise = client.post("/api/registrants", json={
            **REGISTRANT_BASE, "boat_cruise": True, "convention": False
        }, headers=auth).json()
        before = client.get("/api/checkins/stats", headers=auth).json()["boat_cruise_registrants"]
        client.delete(f"/api/registrants/{cruise['id']}", headers=auth)
        after = client.get("/api/checkins/stats", headers=auth).json()["boat_cruise_registrants"]
        assert after == before - 1
