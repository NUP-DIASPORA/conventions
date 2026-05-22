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
    age_group = Column(String, nullable=False, default="adult")  # child, youth, adult
    product_id = Column(String, nullable=True)
    product_name = Column(String, nullable=True)
    payment_amount = Column(String, nullable=True)  # stored as string to avoid float rounding issues
    payer_name = Column(String, nullable=True)  # name of person who made the payment, if different from attendee
    ticket_type = Column(String, default="general")  # general, vip, speaker, staff
    checked_in = Column(Boolean, default=False)
    entered_by = Column(String, nullable=True)   # admin email who created this record
    entered_at = Column(DateTime(timezone=True), server_default=func.now())
    qr_code = Column(Text, nullable=True)  # base64 encoded QR image
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)

    check_ins = relationship("CheckIn", back_populates="registrant")


class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    registrant_id = Column(Integer, ForeignKey("registrants.id"), nullable=False)
    checked_in_at = Column(DateTime(timezone=True), server_default=func.now())
    conference_day = Column(Integer, nullable=False)  # 1-7
    checked_in_by = Column(String, nullable=True)  # admin email

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
    location = Column(String, nullable=True)  # room/hall name
    session_type = Column(String, default="talk")  # talk, workshop, panel, break, plenary
    speaker_id = Column(Integer, ForeignKey("speakers.id"), nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    speaker = relationship("Speaker", back_populates="sessions")
