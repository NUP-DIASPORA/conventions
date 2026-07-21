from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema():
    """Add columns that create_all won't alter on existing tables."""
    inspector = inspect(engine)
    if "registrants" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("registrants")}
    statements = []
    if "vendor" not in cols:
        statements.append("ALTER TABLE registrants ADD COLUMN vendor BOOLEAN DEFAULT FALSE")
    if "vendor_checked_in" not in cols:
        statements.append("ALTER TABLE registrants ADD COLUMN vendor_checked_in BOOLEAN DEFAULT FALSE")
    if not statements:
        return
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
