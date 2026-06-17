"""
Local webhook test script.
Fires a fake Stripe checkout.session.completed event at your local backend.
Run from the backend folder:

    python test_webhook_local.py

Delete the created records afterwards via the admin panel or database.
"""

import hashlib
import hmac
import json
import time
import os
import sys

try:
    import requests
except ImportError:
    print("Install requests first: pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

API_URL = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000") + "/api/webhooks/stripe"
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

if not WEBHOOK_SECRET:
    # Try loading from .env.local then .env
    for env_file in (".env.local", ".env"):
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("STRIPE_WEBHOOK_SECRET="):
                        WEBHOOK_SECRET = line.split("=", 1)[1].strip()
                        break
        if WEBHOOK_SECRET:
            break

if not WEBHOOK_SECRET:
    print("ERROR: STRIPE_WEBHOOK_SECRET not found in .env or .env.local")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Fake events to fire
# ---------------------------------------------------------------------------

FAKE_EVENTS = [
    {
        "label": "Convention full payment ($300)",
        "email": "test.delegate.nup@mailinator.com",
        "name": "Test Delegate NUP",
        "amount_total": 30000,
        "payment_link": os.getenv("STRIPE_LINK_CONVENTION_FULL", "link_conv_full"),
        "payment_intent": "pi_FAKE_CONVENTION_FULL_001",
        "session_id": "cs_FAKE_CONVENTION_FULL_001",
        "custom_fields": [
            {"key": "registrants_name", "text": {"value": "Test Delegate NUP"}, "type": "text"},
            {"key": "city",             "text": {"value": "Los Angeles"},        "type": "text"},
            {"key": "state",            "text": {"value": "CA"},                 "type": "text"},
        ],
    },
    {
        "label": "Boat cruise partial payment ($110)",
        "email": "test.cruise.nup@mailinator.com",
        "name": "Test Cruise NUP",
        "amount_total": 11000,
        "payment_link": os.getenv("STRIPE_LINK_BOAT_CRUISE_PARTIAL", "link_boat_partial"),
        "payment_intent": "pi_FAKE_BOAT_PARTIAL_001",
        "session_id": "cs_FAKE_BOAT_PARTIAL_001",
        "custom_fields": [
            {"key": "registrants_name", "text": {"value": "Test Cruise NUP"}, "type": "text"},
            {"key": "city",             "text": {"value": "Atlanta"},          "type": "text"},
            {"key": "state",            "text": {"value": "GA"},               "type": "text"},
        ],
    },
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_event(e: dict) -> dict:
    return {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": e["session_id"],
                "object": "checkout.session",
                "payment_status": "paid",
                "amount_total": e["amount_total"],
                "payment_link": e["payment_link"],
                "payment_intent": e["payment_intent"],
                "created": int(time.time()),
                "customer_details": {
                    "email": e["email"],
                    "name": e["name"],
                },
                "custom_fields": e["custom_fields"],
            }
        },
    }


def sign(payload: bytes, secret: str) -> str:
    ts = str(int(time.time()))
    signed = f"{ts}.{payload.decode()}"
    sig = hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()
    return f"t={ts},v1={sig}"


# ---------------------------------------------------------------------------
# Fire events
# ---------------------------------------------------------------------------

print(f"\n🚀 Firing {len(FAKE_EVENTS)} fake webhook events at {API_URL}\n")

for e in FAKE_EVENTS:
    payload = json.dumps(make_event(e)).encode()
    headers = {
        "content-type": "application/json",
        "stripe-signature": sign(payload, WEBHOOK_SECRET),
    }
    try:
        resp = requests.post(API_URL, data=payload, headers=headers, timeout=10)
        status = "✅" if resp.status_code == 200 else "❌"
        print(f"{status} {e['label']}")
        print(f"   Email:  {e['email']}")
        print(f"   Name:   {e['name']}")
        print(f"   Status: {resp.status_code} {resp.text}")
    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to {API_URL} — is the backend running?")
    print()

print("Done. Check your admin panel or GET /api/registrants to see the records.")
print("Remember to delete the test records when finished!\n")
