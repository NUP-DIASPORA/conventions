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
    product_type: str          # "convention", "boat_cruise", "vendor", "donation"
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
    vendor: bool = False                # registered for vendor table
    is_vip: bool = False
    payments: List[PaymentInline] = []  # payments to record at registration time
    notes: Optional[str] = None

class RegistrantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    age_group: Optional[str] = None
    convention: Optional[bool] = None
    boat_cruise: Optional[bool] = None
    vendor: Optional[bool] = None
    is_vip: Optional[bool] = None
    checked_in: Optional[bool] = None
    boat_cruise_checked_in: Optional[bool] = None
    vendor_checked_in: Optional[bool] = None
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
    vendor: bool
    is_vip: bool
    checked_in: bool
    boat_cruise_checked_in: bool
    vendor_checked_in: bool
    entered_by: Optional[str]
    entered_at: datetime
    registered_at: datetime
    notes: Optional[str]
    qr_code: Optional[str] = None
    deleted_at: Optional[datetime] = None
    payments: List[PaymentOut] = []

    @field_validator('checked_in', 'boat_cruise_checked_in', 'vendor_checked_in', 'convention', 'boat_cruise', 'vendor', 'is_vip', mode='before')
    @classmethod
    def coerce_none_to_false(cls, v):
        return v if v is not None else False

    class Config:
        from_attributes = True


# --- Audit Log ---
class AuditLogOut(BaseModel):
    id: int
    registrant_id: int
    field: str
    old_value: Optional[str]
    new_value: Optional[str]
    changed_by: Optional[str]
    changed_at: datetime

    class Config:
        from_attributes = True


# --- Check-ins ---
class CheckInCreate(BaseModel):
    registrant_id: int
    event_type: str = "convention"        # "convention", "boat_cruise", or "vendor"
    conference_day: Optional[int] = None  # 1-4 for convention; omit for boat cruise / vendor

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


# --- Pledges ($50k Drive) ---
PLEDGE_PAYMENT_METHODS = ("zelle", "cashapp", "cash", "venmo", "stripe")
PLEDGE_STATUSES = ("open", "fulfilled", "cancelled")


class PledgePaymentCreate(BaseModel):
    amount: str
    paid_at: date
    method: str
    reference: Optional[str] = None

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        m = (v or "").strip().lower()
        if m not in PLEDGE_PAYMENT_METHODS:
            raise ValueError(f"method must be one of: {', '.join(PLEDGE_PAYMENT_METHODS)}")
        return m

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: str) -> str:
        cleaned = (v or "").replace("$", "").replace(",", "").strip()
        try:
            n = float(cleaned)
        except ValueError as e:
            raise ValueError("amount must be a number") from e
        if n <= 0:
            raise ValueError("amount must be greater than 0")
        return f"{n:.2f}"


class PledgePaymentOut(BaseModel):
    id: int
    pledge_id: int
    amount: str
    paid_at: date
    method: str
    reference: Optional[str]
    recorded_by: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True


class PledgeCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    chapter: Optional[str] = None
    message: Optional[str] = None
    amount_pledged: str
    pledged_at: Optional[date] = None
    notes: Optional[str] = None
    source: str = "manual"

    @field_validator("amount_pledged")
    @classmethod
    def validate_pledge_amount(cls, v: str) -> str:
        cleaned = (v or "").replace("$", "").replace(",", "").strip()
        try:
            n = float(cleaned)
        except ValueError as e:
            raise ValueError("amount_pledged must be a number") from e
        if n <= 0:
            raise ValueError("amount_pledged must be greater than 0")
        return f"{n:.2f}"

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        s = (v or "manual").strip().lower()
        if s not in ("manual", "google_form"):
            raise ValueError("source must be manual or google_form")
        return s


class PledgeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    chapter: Optional[str] = None
    message: Optional[str] = None
    amount_pledged: Optional[str] = None
    pledged_at: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("amount_pledged")
    @classmethod
    def validate_pledge_amount(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.replace("$", "").replace(",", "").strip()
        try:
            n = float(cleaned)
        except ValueError as e:
            raise ValueError("amount_pledged must be a number") from e
        if n <= 0:
            raise ValueError("amount_pledged must be greater than 0")
        return f"{n:.2f}"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        s = v.strip().lower()
        if s not in PLEDGE_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(PLEDGE_STATUSES)}")
        return s


class PledgeOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    chapter: Optional[str]
    message: Optional[str]
    amount_pledged: str
    pledged_at: date
    status: str
    source: str
    notes: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    amount_paid: str
    amount_remaining: str
    payments: List[PledgePaymentOut] = []
    class Config:
        from_attributes = True


class PledgeSummary(BaseModel):
    total_pledged: str
    total_paid: str
    total_remaining: str
    open_count: int
    fulfilled_count: int
    cancelled_count: int
    pledge_count: int


class PledgeBulkUploadResult(BaseModel):
    created: int
    skipped: int
    errors: List[str]
