"""
Tests for /api/checkins — check-in, duplicate prevention, stats, breakdown.
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
        "first_name": "Dave", "last_name": "Lee",
        "email": "dave@example.com", "age_group": "adult",
        "convention": True, "boat_cruise": True,
    }, headers=auth)
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Check-in
# ---------------------------------------------------------------------------

class TestCheckIn:

    def test_convention_checkin(self, client, auth, registrant):
        resp = client.post("/api/checkins", json={
            "registrant_id": registrant["id"],
            "event_type": "convention",
            "conference_day": 1,
        }, headers=auth)
        assert resp.status_code == 201
        body = resp.json()
        assert body["event_type"] == "convention"
        assert body["conference_day"] == 1

    def test_convention_checkin_sets_flag(self, client, auth, registrant):
        client.post("/api/checkins", json={
            "registrant_id": registrant["id"],
            "event_type": "convention",
        }, headers=auth)
        reg = client.get(f"/api/registrants/{registrant['id']}", headers=auth).json()
        assert reg["checked_in"] is True

    def test_boat_cruise_checkin(self, client, auth, registrant):
        resp = client.post("/api/checkins", json={
            "registrant_id": registrant["id"],
            "event_type": "boat_cruise",
        }, headers=auth)
        assert resp.status_code == 201

    def test_boat_cruise_checkin_sets_flag(self, client, auth, registrant):
        client.post("/api/checkins", json={
            "registrant_id": registrant["id"],
            "event_type": "boat_cruise",
        }, headers=auth)
        reg = client.get(f"/api/registrants/{registrant['id']}", headers=auth).json()
        assert reg["boat_cruise_checked_in"] is True

    def test_checkin_nonexistent_registrant(self, client, auth):
        resp = client.post("/api/checkins", json={
            "registrant_id": 99999,
            "event_type": "convention",
        }, headers=auth)
        assert resp.status_code == 404

    def test_invalid_event_type(self, client, auth, registrant):
        resp = client.post("/api/checkins", json={
            "registrant_id": registrant["id"],
            "event_type": "gala",
        }, headers=auth)
        assert resp.status_code == 400

    def test_checkin_requires_auth(self, client, registrant=None):
        resp = client.post("/api/checkins", json={
            "registrant_id": 1, "event_type": "convention"
        })
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Duplicate prevention
# ---------------------------------------------------------------------------

class TestDuplicateCheckIn:

    def test_duplicate_convention_checkin_rejected(self, client, auth, registrant):
        payload = {"registrant_id": registrant["id"], "event_type": "convention"}
        client.post("/api/checkins", json=payload, headers=auth)
        resp = client.post("/api/checkins", json=payload, headers=auth)
        assert resp.status_code == 400

    def test_duplicate_boat_cruise_checkin_rejected(self, client, auth, registrant):
        payload = {"registrant_id": registrant["id"], "event_type": "boat_cruise"}
        client.post("/api/checkins", json=payload, headers=auth)
        resp = client.post("/api/checkins", json=payload, headers=auth)
        assert resp.status_code == 400

    def test_convention_and_boat_cruise_independent(self, client, auth, registrant):
        """Checking in for convention should not block boat cruise check-in."""
        client.post("/api/checkins", json={
            "registrant_id": registrant["id"], "event_type": "convention"
        }, headers=auth)
        resp = client.post("/api/checkins", json={
            "registrant_id": registrant["id"], "event_type": "boat_cruise"
        }, headers=auth)
        assert resp.status_code == 201


# ---------------------------------------------------------------------------
# List check-ins
# ---------------------------------------------------------------------------

class TestListCheckIns:

    def test_list_all(self, client, auth, registrant):
        client.post("/api/checkins", json={
            "registrant_id": registrant["id"], "event_type": "convention"
        }, headers=auth)
        resp = client.get("/api/checkins", headers=auth)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_filter_by_event_type(self, client, auth, registrant):
        client.post("/api/checkins", json={
            "registrant_id": registrant["id"], "event_type": "convention"
        }, headers=auth)
        client.post("/api/checkins", json={
            "registrant_id": registrant["id"], "event_type": "boat_cruise"
        }, headers=auth)
        resp = client.get("/api/checkins?event_type=convention", headers=auth)
        assert all(c["event_type"] == "convention" for c in resp.json())

    def test_filter_by_registrant(self, client, auth, registrant):
        client.post("/api/checkins", json={
            "registrant_id": registrant["id"], "event_type": "convention"
        }, headers=auth)
        resp = client.get(f"/api/checkins?registrant_id={registrant['id']}", headers=auth)
        assert all(c["registrant_id"] == registrant["id"] for c in resp.json())


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

class TestCheckInStats:

    def test_stats_shape(self, client, auth, registrant):
        resp = client.get("/api/checkins/stats", headers=auth)
        assert resp.status_code == 200
        body = resp.json()
        for key in ["total_registrants", "convention_checkins", "boat_cruise_checkins",
                    "vip_registrants", "convention_registrants", "boat_cruise_registrants"]:
            assert key in body

    def test_stats_counts(self, client, auth, registrant):
        client.post("/api/checkins", json={
            "registrant_id": registrant["id"], "event_type": "convention"
        }, headers=auth)
        body = client.get("/api/checkins/stats", headers=auth).json()
        assert body["convention_checkins"] == 1
        assert body["boat_cruise_checkins"] == 0


# ---------------------------------------------------------------------------
# Breakdown
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    "sqlite" in __import__("os").environ.get("DATABASE_URL", ""),
    reason="breakdown endpoint uses initcap() which is Postgres-only",
)
class TestCheckInBreakdown:

    def test_breakdown_shape(self, client, auth, registrant):
        resp = client.get("/api/checkins/breakdown", headers=auth)
        assert resp.status_code == 200
        body = resp.json()
        assert "by_country" in body
        assert "by_state" in body
        assert "by_age_group" in body

    def test_breakdown_age_group(self, client, auth):
        # Create registrants with different age groups
        for email, age in [("a@x.com", "adult"), ("b@x.com", "youth"), ("c@x.com", "child")]:
            client.post("/api/registrants", json={
                "first_name": "X", "last_name": "Y",
                "email": email, "age_group": age,
            }, headers=auth)
        body = client.get("/api/checkins/breakdown", headers=auth).json()
        age_names = [r["name"] for r in body["by_age_group"]]
        assert "adult" in age_names
