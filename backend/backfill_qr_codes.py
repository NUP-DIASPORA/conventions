"""
Run this once to generate QR codes for all registrants that don't have one.
Usage: python backfill_qr_codes.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app import models
from app.utils.qr import generate_qr_code, get_registrant_qr_data

def backfill():
    db = SessionLocal()
    try:
        registrants = db.query(models.Registrant).filter(
            models.Registrant.qr_code == None
        ).all()
        print(f"Found {len(registrants)} registrants without QR codes")
        for r in registrants:
            qr_data = get_registrant_qr_data(r.id, r.email)
            r.qr_code = generate_qr_code(qr_data)
            print(f"  Generated QR for {r.first_name} {r.last_name} (id={r.id})")
        db.commit()
        print(f"Done. {len(registrants)} QR codes generated.")
    finally:
        db.close()

if __name__ == "__main__":
    backfill()
