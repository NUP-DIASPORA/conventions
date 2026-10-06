"""Tests for the $50k drive pledge ledger."""

from datetime import date

import pytest
from tests.conftest import create_admin, get_auth_headers


@pytest.fixture
def auth(client, db_session):
    create_admin(db_session)
    return get_auth_headers(client)


def test_create_pledge_and_record_payments(client, auth):
    res = client.post(
        "/api/pledges",
        headers=auth,
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "555-0100",
            "chapter": "LA",
            "amount_pledged": "500",
            "pledged_at": "2026-09-01",
        },
    )
    assert res.status_code == 201, res.text
    pledge = res.json()
    assert pledge["amount_pledged"] == "500.00"
    assert pledge["amount_paid"] == "0.00"
    assert pledge["amount_remaining"] == "500.00"
    assert pledge["status"] == "open"

    res = client.post(
        f"/api/pledges/{pledge['id']}/payments",
        headers=auth,
        json={
            "amount": "200",
            "paid_at": "2026-09-15",
            "method": "zelle",
            "reference": "Z123",
        },
    )
    assert res.status_code == 201, res.text
    pledge = res.json()
    assert pledge["amount_paid"] == "200.00"
    assert pledge["amount_remaining"] == "300.00"
    assert pledge["status"] == "open"
    assert len(pledge["payments"]) == 1

    res = client.post(
        f"/api/pledges/{pledge['id']}/payments",
        headers=auth,
        json={
            "amount": "300",
            "paid_at": str(date.today()),
            "method": "venmo",
        },
    )
    assert res.status_code == 201, res.text
    pledge = res.json()
    assert pledge["amount_remaining"] == "0.00"
    assert pledge["status"] == "fulfilled"

    summary = client.get("/api/pledges/summary", headers=auth).json()
    assert summary["total_pledged"] == "500.00"
    assert summary["total_paid"] == "500.00"
    assert summary["fulfilled_count"] == 1


def test_bulk_upload_skips_duplicates(client, auth):
    csv_body = (
        "Timestamp,Name,Email Address,Phone Number,Chapter,Pledge Amount,Message to NUP\n"
        "9/27/2026 10:00:00,Alice,alice@example.com,111,West,100,Hello\n"
        "9/27/2026 11:00:00,Alice,alice@example.com,111,West,100,Again\n"
        "9/28/2026 09:00:00,Bob,bob@example.com,222,East,$250.00,Thanks\n"
    )
    res = client.post(
        "/api/pledges/bulk-upload",
        headers=auth,
        files={"file": ("pledges.csv", csv_body, "text/csv")},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["created"] == 2
    assert data["skipped"] == 1

    listed = client.get("/api/pledges", headers=auth).json()
    assert len(listed) == 2


def test_cancel_pledge(client, auth):
    pledge = client.post(
        "/api/pledges",
        headers=auth,
        json={"name": "Sam", "email": "sam@example.com", "amount_pledged": "50"},
    ).json()
    res = client.delete(f"/api/pledges/{pledge['id']}", headers=auth)
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"
