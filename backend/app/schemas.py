from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time


# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class AdminCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class AdminOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    class Config:
        from_attributes = True


# --- Registrants ---
class RegistrantCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    age_group: str = "adult"  # child, youth, adult
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    payment_amount: Optional[str] = None
    payer_name: Optional[str] = None
    ticket_type: Optional[str] = "general"
    notes: Optional[str] = None

class RegistrantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    age_group: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    payment_amount: Optional[str] = None
    payer_name: Optional[str] = None
    ticket_type: Optional[str] = None
    checked_in: Optional[bool] = None
    notes: Optional[str] = None

class RegistrantOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    continent: Optional[str]
    age_group: str
    product_id: Optional[str]
    product_name: Optional[str]
    payment_amount: Optional[str]
    payer_name: Optional[str]
    ticket_type: str
    checked_in: bool
    entered_by: Optional[str]
    entered_at: datetime
    registered_at: datetime
    notes: Optional[str]
    class Config:
        from_attributes = True


# --- Check-ins ---
class CheckInCreate(BaseModel):
    registrant_id: int
    conference_day: int

class CheckInOut(BaseModel):
    id: int
    registrant_id: int
    checked_in_at: datetime
    conference_day: int
    checked_in_by: Optional[str]
    class Config:
        from_attributes = True


# --- Speakers ---
class SpeakerCreate(BaseModel):
    first_name: str
    last_name: str
    title: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    is_keynote: Optional[bool] = False

class SpeakerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    is_keynote: Optional[bool] = None

class SpeakerOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    title: Optional[str]
    bio: Optional[str]
    photo_url: Optional[str]
    organization: Optional[str]
    country: Optional[str]
    is_keynote: bool
    class Config:
        from_attributes = True


# --- Program Sessions ---
class ProgramSessionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    session_date: date
    start_time: time
    end_time: time
    location: Optional[str] = None
    session_type: Optional[str] = "talk"
    speaker_id: Optional[int] = None
    is_public: Optional[bool] = True

class ProgramSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    session_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    session_type: Optional[str] = None
    speaker_id: Optional[int] = None
    is_public: Optional[bool] = None

class ProgramSessionOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    session_date: date
    start_time: time
    end_time: time
    location: Optional[str]
    session_type: str
    speaker_id: Optional[int]
    speaker: Optional[SpeakerOut]
    is_public: bool
    class Config:
        from_attributes = True
