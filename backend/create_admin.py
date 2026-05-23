"""
Run this once to create your first admin account.
Usage:
    cd backend
    source venv/bin/activate
    python create_admin.py
"""
import sys
from app.database import SessionLocal, engine
from app import models
from app.utils.auth import get_password_hash

# Create tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

def main():
    print("=== NUP Convention — Create First Admin ===\n")
    full_name = input("Full name: ").strip()
    email = input("Email: ").strip()
    password = input("Password: ").strip()

    if not full_name or not email or not password:
        print("All fields are required.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(models.Admin).filter(models.Admin.email == email).first()
        if existing:
            print(f"\nAn admin with email '{email}' already exists.")
            sys.exit(1)

        admin = models.Admin(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
        )
        db.add(admin)
        db.commit()
        print(f"\nAdmin '{full_name}' created successfully.")
        print(f"You can now log in at http://localhost:5173/admin/login")
    finally:
        db.close()

if __name__ == "__main__":
    main()
