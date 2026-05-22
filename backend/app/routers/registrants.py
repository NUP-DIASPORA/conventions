from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin
from ..utils.qr import generate_qr_code, get_registrant_qr_data

router = APIRouter(prefix="/api/registrants", tags=["registrants"])


@router.get("/", response_model=List[schemas.RegistrantOut])
def list_registrants(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by name or email"),
    ticket_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    query = db.query(models.Registrant)
    if search:
        query = query.filter(
            (models.Registrant.first_name.ilike(f"%{search}%")) |
            (models.Registrant.last_name.ilike(f"%{search}%")) |
            (models.Registrant.email.ilike(f"%{search}%"))
        )
    if ticket_type:
        query = query.filter(models.Registrant.ticket_type == ticket_type)
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.RegistrantOut, status_code=201)
def create_registrant(
    registrant_in: schemas.RegistrantCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    existing = db.query(models.Registrant).filter(models.Registrant.email == registrant_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    registrant = models.Registrant(**registrant_in.model_dump(), entered_by=current_admin.email)
    db.add(registrant)
    db.commit()
    db.refresh(registrant)

    # Generate QR code
    qr_data = get_registrant_qr_data(registrant.id, registrant.email)
    registrant.qr_code = generate_qr_code(qr_data)
    db.commit()
    db.refresh(registrant)

    return registrant


@router.get("/{registrant_id}", response_model=schemas.RegistrantOut)
def get_registrant(
    registrant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(models.Registrant.id == registrant_id).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")
    return registrant


@router.patch("/{registrant_id}", response_model=schemas.RegistrantOut)
def update_registrant(
    registrant_id: int,
    updates: schemas.RegistrantUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(models.Registrant.id == registrant_id).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(registrant, field, value)
    db.commit()
    db.refresh(registrant)
    return registrant


@router.delete("/{registrant_id}", status_code=204)
def delete_registrant(
    registrant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(models.Registrant.id == registrant_id).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")
    db.delete(registrant)
    db.commit()


@router.get("/{registrant_id}/qr")
def get_qr_code(
    registrant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(models.Registrant.id == registrant_id).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")
    return {"qr_code": registrant.qr_code}
