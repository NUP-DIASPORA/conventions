from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin
from ..utils.qr import generate_qr_code, get_registrant_qr_data

router = APIRouter(prefix="/api/registrants", tags=["registrants"])


@router.get("", response_model=List[schemas.RegistrantOut])
def list_registrants(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by name or email"),
    convention: Optional[bool] = None,
    boat_cruise: Optional[bool] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    query = db.query(models.Registrant).filter(models.Registrant.deleted_at == None)
    if search:
        query = query.filter(
            (models.Registrant.first_name.ilike(f"%{search}%")) |
            (models.Registrant.last_name.ilike(f"%{search}%")) |
            (models.Registrant.email.ilike(f"%{search}%"))
        )
    if convention is not None:
        query = query.filter(models.Registrant.convention == convention)
    if boat_cruise is not None:
        query = query.filter(models.Registrant.boat_cruise == boat_cruise)
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=schemas.RegistrantOut, status_code=201)
def create_registrant(
    registrant_in: schemas.RegistrantCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    existing = db.query(models.Registrant).filter(
        models.Registrant.email == registrant_in.email,
        models.Registrant.deleted_at == None,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    payments_data = registrant_in.payments
    registrant_data = registrant_in.model_dump(exclude={"payments"})

    registrant = models.Registrant(**registrant_data, entered_by=current_admin.email)
    db.add(registrant)
    db.commit()
    db.refresh(registrant)

    # Create any inline payments
    for p in payments_data:
        payment = models.Payment(registrant_id=registrant.id, **p.model_dump())
        db.add(payment)
        if p.product_type == "convention":
            registrant.convention = True
        elif p.product_type == "boat_cruise":
            registrant.boat_cruise = True

    # Generate QR code
    qr_data = get_registrant_qr_data(registrant.id, registrant.email)
    registrant.qr_code = generate_qr_code(qr_data)

    # Audit log: registrant created
    db.add(models.AuditLog(
        registrant_id=registrant.id,
        field="[created]",
        old_value=None,
        new_value=f"{registrant.first_name} {registrant.last_name} ({registrant.email})",
        changed_by=current_admin.email,
    ))

    db.commit()
    db.refresh(registrant)
    return registrant


# --- Static sub-paths must come BEFORE /{registrant_id} ---

@router.get("/deleted", response_model=List[schemas.RegistrantOut])
def list_deleted_registrants(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return (
        db.query(models.Registrant)
        .filter(models.Registrant.deleted_at != None)
        .order_by(models.Registrant.deleted_at.desc())
        .all()
    )


@router.post("/backfill-qr", status_code=200)
def backfill_qr_codes(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Generate QR codes for all registrants that don't have one."""
    from ..utils.qr import generate_qr_code, get_registrant_qr_data
    registrants = db.query(models.Registrant).filter(
        models.Registrant.qr_code == None
    ).all()
    for r in registrants:
        qr_data = get_registrant_qr_data(r.id, r.email)
        r.qr_code = generate_qr_code(qr_data)
    db.commit()
    return {"generated": len(registrants)}

@router.get("/by-email", response_model=schemas.RegistrantOut)
def get_by_email(
    email: str,
    db: Session = Depends(get_db),
):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.email == email,
        models.Registrant.deleted_at == None,
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="No registration found for that email")
    return registrant


@router.get("/lookup/by-qr", response_model=schemas.RegistrantOut)
def lookup_by_qr(
    qr_data: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    try:
        parts = qr_data.split(":")
        registrant_id = int(parts[1])
    except (IndexError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid QR code")
    registrant = db.query(models.Registrant).filter(
        models.Registrant.id == registrant_id,
        models.Registrant.deleted_at == None,
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")
    return registrant


# --- Dynamic routes ---

@router.get("/{registrant_id}", response_model=schemas.RegistrantOut)
def get_registrant(
    registrant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.id == registrant_id,
        models.Registrant.deleted_at == None,
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")
    return registrant


@router.patch("/{registrant_id}", response_model=schemas.RegistrantOut)
def update_registrant(
    registrant_id: int,
    updates: schemas.RegistrantUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.id == registrant_id,
        models.Registrant.deleted_at == None,
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")
    update_data = updates.model_dump(exclude_unset=True)
    if 'email' in update_data and update_data['email'] != registrant.email:
        conflict = db.query(models.Registrant).filter(
            models.Registrant.email == update_data['email'],
            models.Registrant.deleted_at == None,
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already in use by another registrant")
    for field, value in update_data.items():
        old_value = getattr(registrant, field, None)
        if str(old_value) != str(value):
            db.add(models.AuditLog(
                registrant_id=registrant_id,
                field=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(value) if value is not None else None,
                changed_by=current_admin.email,
            ))
        setattr(registrant, field, value)
    db.commit()
    db.refresh(registrant)
    return registrant


@router.get("/{registrant_id}/history", response_model=List[schemas.AuditLogOut])
def get_registrant_history(
    registrant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return (
        db.query(models.AuditLog)
        .filter(models.AuditLog.registrant_id == registrant_id)
        .order_by(models.AuditLog.changed_at.desc())
        .all()
    )


@router.delete("/{registrant_id}", status_code=204)
def delete_registrant(
    registrant_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    from sqlalchemy.sql import func as sqlfunc
    registrant = db.query(models.Registrant).filter(
        models.Registrant.id == registrant_id,
        models.Registrant.deleted_at == None,
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")

    registrant.deleted_at = sqlfunc.now()
    db.add(models.AuditLog(
        registrant_id=registrant_id,
        field="[deleted]",
        old_value=f"{registrant.first_name} {registrant.last_name} ({registrant.email})",
        new_value=None,
        changed_by=current_admin.email,
    ))
    db.commit()


@router.get("/{registrant_id}/qr")
def get_qr_code(
    registrant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.id == registrant_id,
        models.Registrant.deleted_at == None,
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")
    return {"qr_code": registrant.qr_code}
