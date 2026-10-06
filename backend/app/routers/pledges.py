import csv
import io
from datetime import date
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/pledges", tags=["pledges"])


def _money(value: Optional[Union[str, float, int]]) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = str(value).replace("$", "").replace(",", "").strip()
    if not cleaned:
        return 0.0
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _fmt(n: float) -> str:
    return f"{n:.2f}"


def _paid_total(pledge: models.Pledge, db: Optional[Session] = None) -> float:
    if db is not None:
        rows = (
            db.query(models.PledgePayment)
            .filter(models.PledgePayment.pledge_id == pledge.id)
            .all()
        )
        return sum(_money(p.amount) for p in rows)
    return sum(_money(p.amount) for p in (pledge.payments or []))


def _refresh_status(pledge: models.Pledge, db: Optional[Session] = None) -> None:
    """Auto-mark fulfilled when paid >= pledged; reopen if underpaid and was fulfilled."""
    if pledge.status == "cancelled":
        return
    pledged = _money(pledge.amount_pledged)
    paid = _paid_total(pledge, db)
    if paid >= pledged and pledged > 0:
        pledge.status = "fulfilled"
    elif pledge.status == "fulfilled" and paid < pledged:
        pledge.status = "open"


def _to_out(pledge: models.Pledge) -> schemas.PledgeOut:
    pledged = _money(pledge.amount_pledged)
    paid = _paid_total(pledge)
    remaining = max(pledged - paid, 0.0)
    payments = sorted(pledge.payments or [], key=lambda p: (p.paid_at, p.id), reverse=True)
    return schemas.PledgeOut(
        id=pledge.id,
        name=pledge.name,
        email=pledge.email,
        phone=pledge.phone,
        chapter=pledge.chapter,
        message=pledge.message,
        amount_pledged=_fmt(pledged),
        pledged_at=pledge.pledged_at,
        status=pledge.status,
        source=pledge.source,
        notes=pledge.notes,
        created_by=pledge.created_by,
        created_at=pledge.created_at,
        amount_paid=_fmt(paid),
        amount_remaining=_fmt(remaining),
        payments=[schemas.PledgePaymentOut.model_validate(p) for p in payments],
    )


def _get_pledge_or_404(db: Session, pledge_id: int) -> models.Pledge:
    pledge = (
        db.query(models.Pledge)
        .options(joinedload(models.Pledge.payments))
        .filter(models.Pledge.id == pledge_id)
        .first()
    )
    if not pledge:
        raise HTTPException(status_code=404, detail="Pledge not found")
    return pledge


@router.get("/summary", response_model=schemas.PledgeSummary)
def pledge_summary(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    pledges = (
        db.query(models.Pledge)
        .options(joinedload(models.Pledge.payments))
        .all()
    )
    total_pledged = 0.0
    total_paid = 0.0
    open_count = fulfilled_count = cancelled_count = 0
    for p in pledges:
        if p.status == "cancelled":
            cancelled_count += 1
            continue
        pledged = _money(p.amount_pledged)
        paid = _paid_total(p)
        total_pledged += pledged
        total_paid += min(paid, pledged) if pledged else paid
        if p.status == "fulfilled" or paid >= pledged > 0:
            fulfilled_count += 1
        else:
            open_count += 1
    remaining = max(total_pledged - total_paid, 0.0)
    return schemas.PledgeSummary(
        total_pledged=_fmt(total_pledged),
        total_paid=_fmt(total_paid),
        total_remaining=_fmt(remaining),
        open_count=open_count,
        fulfilled_count=fulfilled_count,
        cancelled_count=cancelled_count,
        pledge_count=len(pledges),
    )


@router.get("", response_model=List[schemas.PledgeOut])
def list_pledges(
    status: Optional[str] = Query(None),
    chapter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    q = db.query(models.Pledge).options(joinedload(models.Pledge.payments))
    if status:
        q = q.filter(models.Pledge.status == status.strip().lower())
    if chapter:
        q = q.filter(models.Pledge.chapter.ilike(f"%{chapter.strip()}%"))
    if search:
        s = f"%{search.strip()}%"
        q = q.filter(
            (models.Pledge.name.ilike(s)) | (models.Pledge.email.ilike(s))
        )
    pledges = q.order_by(models.Pledge.pledged_at.desc(), models.Pledge.id.desc()).all()
    return [_to_out(p) for p in pledges]


@router.get("/{pledge_id}", response_model=schemas.PledgeOut)
def get_pledge(
    pledge_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return _to_out(_get_pledge_or_404(db, pledge_id))


@router.post("", response_model=schemas.PledgeOut, status_code=201)
def create_pledge(
    body: schemas.PledgeCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    pledge = models.Pledge(
        name=body.name.strip(),
        email=str(body.email).strip().lower(),
        phone=(body.phone or "").strip() or None,
        chapter=(body.chapter or "").strip() or None,
        message=(body.message or "").strip() or None,
        amount_pledged=body.amount_pledged,
        pledged_at=body.pledged_at or date.today(),
        status="open",
        source=body.source,
        notes=(body.notes or "").strip() or None,
        created_by=current_admin.email,
    )
    db.add(pledge)
    db.commit()
    db.refresh(pledge)
    pledge = _get_pledge_or_404(db, pledge.id)
    return _to_out(pledge)


@router.patch("/{pledge_id}", response_model=schemas.PledgeOut)
def update_pledge(
    pledge_id: int,
    body: schemas.PledgeUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    pledge = _get_pledge_or_404(db, pledge_id)
    data = body.model_dump(exclude_unset=True)
    if "email" in data and data["email"] is not None:
        data["email"] = str(data["email"]).strip().lower()
    for key, value in data.items():
        setattr(pledge, key, value)
    _refresh_status(pledge, db)
    db.commit()
    pledge = _get_pledge_or_404(db, pledge_id)
    return _to_out(pledge)


@router.delete("/{pledge_id}", response_model=schemas.PledgeOut)
def cancel_pledge(
    pledge_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Soft-cancel: keep payment history."""
    pledge = _get_pledge_or_404(db, pledge_id)
    pledge.status = "cancelled"
    db.commit()
    pledge = _get_pledge_or_404(db, pledge_id)
    return _to_out(pledge)


@router.post("/{pledge_id}/payments", response_model=schemas.PledgeOut, status_code=201)
def add_pledge_payment(
    pledge_id: int,
    body: schemas.PledgePaymentCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    pledge = _get_pledge_or_404(db, pledge_id)
    if pledge.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot add payment to a cancelled pledge")
    payment = models.PledgePayment(
        pledge_id=pledge.id,
        amount=body.amount,
        paid_at=body.paid_at,
        method=body.method,
        reference=(body.reference or "").strip() or None,
        recorded_by=current_admin.email,
    )
    db.add(payment)
    db.flush()
    _refresh_status(pledge, db)
    db.commit()
    pledge = _get_pledge_or_404(db, pledge_id)
    return _to_out(pledge)


@router.delete("/payments/{payment_id}", response_model=schemas.PledgeOut)
def delete_pledge_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    payment = (
        db.query(models.PledgePayment)
        .filter(models.PledgePayment.id == payment_id)
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    pledge_id = payment.pledge_id
    db.delete(payment)
    db.flush()
    pledge = _get_pledge_or_404(db, pledge_id)
    _refresh_status(pledge, db)
    db.commit()
    pledge = _get_pledge_or_404(db, pledge_id)
    return _to_out(pledge)


def _csv_get(row: dict, *keys: str) -> str:
    lower_map = { (k or "").strip().lower(): v for k, v in row.items() }
    for key in keys:
        val = lower_map.get(key.lower())
        if val is not None and str(val).strip():
            return str(val).strip()
    return ""


@router.post("/bulk-upload", response_model=schemas.PledgeBulkUploadResult)
async def bulk_upload_pledges(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    """Import Google Form CSV export. Skips open duplicates (same email + amount)."""
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV has no header row")

    created = skipped = 0
    errors: List[str] = []

    # Preload open pledges for duplicate check
    open_pledges = (
        db.query(models.Pledge)
        .filter(models.Pledge.status == "open")
        .all()
    )
    open_keys = {
        (p.email.lower(), _fmt(_money(p.amount_pledged)))
        for p in open_pledges
    }

    for i, row in enumerate(reader, start=2):
        name = _csv_get(row, "Name", "name", "Full Name")
        email = _csv_get(row, "Email Address", "Email", "email").lower()
        phone = _csv_get(row, "Phone Number", "Phone", "phone") or None
        chapter = _csv_get(row, "Chapter", "chapter") or None
        message = _csv_get(row, "Message to NUP", "Message", "message") or None
        amount_raw = _csv_get(row, "Pledge Amount", "Amount", "amount_pledged", "amount")

        if not name and not email and not amount_raw:
            continue
        if not name or not email or not amount_raw:
            errors.append(f"Row {i}: missing name, email, or pledge amount")
            continue

        try:
            amount = schemas.PledgeCreate(
                name=name,
                email=email,
                amount_pledged=amount_raw,
            ).amount_pledged
        except Exception as e:
            errors.append(f"Row {i}: invalid amount ({e})")
            continue

        key = (email, amount)
        if key in open_keys:
            skipped += 1
            continue

        # Timestamp column from Google Forms is usually "Timestamp"
        ts = _csv_get(row, "Timestamp", "timestamp")
        pledged_at = date.today()
        if ts:
            # Formats like 9/27/2026 20:15:00 or 2026-09-27T...
            for fmt_part in (ts.split()[0], ts[:10]):
                for sep in ("/", "-"):
                    parts = fmt_part.split(sep)
                    if len(parts) == 3:
                        try:
                            if len(parts[0]) == 4:
                                pledged_at = date(int(parts[0]), int(parts[1]), int(parts[2]))
                            else:
                                pledged_at = date(int(parts[2]), int(parts[0]), int(parts[1]))
                            break
                        except ValueError:
                            continue
                else:
                    continue
                break

        pledge = models.Pledge(
            name=name,
            email=email,
            phone=phone,
            chapter=chapter,
            message=message,
            amount_pledged=amount,
            pledged_at=pledged_at,
            status="open",
            source="google_form",
            created_by=current_admin.email,
        )
        db.add(pledge)
        open_keys.add(key)
        created += 1

    db.commit()
    return schemas.PledgeBulkUploadResult(created=created, skipped=skipped, errors=errors)
