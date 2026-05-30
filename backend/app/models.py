from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Registrant(Base):
    __tablename__ = "registrants"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    continent = Column(String, nullable=True)
    age_group = Column(String, nullable=False, default="adult")  # child, youth, adult

    # What they registered for
    convention = Column(Boolean, default=False)       # paid for 4-day convention
    boat_cruise = Column(Boolean, default=False)      # paid for Saturday boat cruise

    # VIP flag
    is_vip = Column(Boolean, default=False)

    # Check-in flags (convenience — source of truth is check_ins table)
    checked_in = Column(Boolean, default=False)
    boat_cruise_checked_in = Column(Boolean, default=False)

    entered_by = Column(String, nullable=True)
    entered_at = Column(DateTime(timezone=True), server_default=func.now())
    qr_code = Column(Text, nullable=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)

    payments = relationship("Payment", back_populates="registrant", cascade="all, delete-orphan")
    check_ins = relationship("CheckIn", back_populates="registrant", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    registrant_id = Column(Integer, ForeignKey("registrants.id"), nullable=True)  # null = unattributed
    product_type = Column(String, nullable=False)  # "convention", "boat_cruise", "donation"
    installment = Column(Integer, nullable=True)   # 1 or 2; null = full payment
    amount = Column(String, nullable=False)        # e.g. "300.00"
    payer_name = Column(String, nullable=True)     # if someone else paid
    stripe_pi_id = Column(String, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    registrant = relationship("Registrant", back_populates="payments")


class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    registrant_id = Column(Integer, ForeignKey("registrants.id"), nullable=False)
    event_type = Column(String, nullable=False, default="convention")  # "convention" | "boat_cruise"
    conference_day = Column(Integer, nullable=True)   # 1-4 for convention; null for boat cruise
    checked_in_at = Column(DateTime(timezone=True), server_default=func.now())
    checked_in_by = Column(String, nullable=True)

    registrant = relationship("Registrant", back_populates="check_ins")


class Speaker(Base):
    __tablename__ = "speakers"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    title = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    country = Column(String, nullable=True)
    is_keynote = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sessions = relationship("ProgramSession", back_populates="speaker")


class ProgramSession(Base):
    __tablename__ = "program_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    location = Column(String, nullable=True)
    session_type = Column(String, default="talk")  # talk, workshop, panel, break, plenary
    speaker_id = Column(Integer, ForeignKey("speakers.id"), nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    speaker = relationship("Speaker", back_populates="sessions")
