from pydantic import BaseModel, EmailStr, field_validator
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

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class AdminOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    class Config:
        from_attributes = True


# --- Payments ---
class PaymentInline(BaseModel):
    """Embedded in RegistrantCreate to record payments at registration time."""
    product_type: str          # "convention", "boat_cruise", "donation"
    installment: Optional[int] = None   # 1 or 2; null = full payment
    amount: str
    payer_name: Optional[str] = None
    stripe_pi_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    registrant_id: Optional[int] = None  # null = unattributed payment
    product_type: str
    installment: Optional[int] = None
    amount: str
    payer_name: Optional[str] = None
    stripe_pi_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    registrant_id: Optional[int]
    product_type: str
    installment: Optional[int]
    amount: str
    payer_name: Optional[str]
    stripe_pi_id: Optional[str]
    paid_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
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
    age_group: str = "adult"           # child, youth, adult
    convention: bool = False            # registered for convention
    boat_cruise: bool = False           # registered for boat cruise
    payments: List[PaymentInline] = []  # payments to record at registration time
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
    convention: Optional[bool] = None
    boat_cruise: Optional[bool] = None
    checked_in: Optional[bool] = None
    boat_cruise_checked_in: Optional[bool] = None
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
    convention: bool
    boat_cruise: bool
    checked_in: bool
    boat_cruise_checked_in: bool
    entered_by: Optional[str]
    entered_at: datetime
    registered_at: datetime
    notes: Optional[str]
    payments: List[PaymentOut] = []

    @field_validator('checked_in', 'boat_cruise_checked_in', 'convention', 'boat_cruise', mode='before')
    @classmethod
    def coerce_none_to_false(cls, v):
        return v if v is not None else False

    class Config:
        from_attributes = True


# --- Check-ins ---
class CheckInCreate(BaseModel):
    registrant_id: int
    event_type: str = "convention"        # "convention" or "boat_cruise"
    conference_day: Optional[int] = None  # 1-4 for convention; omit for boat cruise

class CheckInOut(BaseModel):
    id: int
    registrant_id: int
    event_type: str
    conference_day: Optional[int]
    checked_in_at: datetime
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
