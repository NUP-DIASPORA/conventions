from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/checkins", tags=["checkins"])


@router.post("/", response_model=schemas.CheckInOut, status_code=201)
def check_in_registrant(
    checkin_in: schemas.CheckInCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    registrant = db.query(models.Registrant).filter(models.Registrant.id == checkin_in.registrant_id).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")

    # Check if already checked in today
    existing = db.query(models.CheckIn).filter(
        models.CheckIn.registrant_id == checkin_in.registrant_id,
        models.CheckIn.conference_day == checkin_in.conference_day,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Already checked in for day {checkin_in.conference_day}")

    checkin = models.CheckIn(
        registrant_id=checkin_in.registrant_id,
        conference_day=checkin_in.conference_day,
        checked_in_by=current_admin.email,
    )
    db.add(checkin)

    # Mark registrant as checked in
    registrant.checked_in = True

    db.commit()
    db.refresh(checkin)
    return checkin


@router.post("/scan", response_model=schemas.CheckInOut, status_code=201)
def check_in_by_qr(
    qr_data: str = Query(..., description="Raw QR code data string"),
    conference_day: int = Query(..., ge=1, le=7),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    """Check in a registrant via QR code scan. Format: NUP-CONVENTION-2025:{id}:{email}"""
    try:
        parts = qr_data.split(":")
        registrant_id = int(parts[1])
    except (IndexError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid QR code format")

    return check_in_registrant(
        schemas.CheckInCreate(registrant_id=registrant_id, conference_day=conference_day),
        db=db,
        current_admin=current_admin,
    )


@router.get("/", response_model=List[schemas.CheckInOut])
def list_checkins(
    conference_day: Optional[int] = None,
    registrant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    query = db.query(models.CheckIn)
    if conference_day:
        query = query.filter(models.CheckIn.conference_day == conference_day)
    if registrant_id:
        query = query.filter(models.CheckIn.registrant_id == registrant_id)
    return query.all()


@router.get("/stats")
def checkin_stats(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    total_registrants = db.query(models.Registrant).count()
    total_checkins = db.query(models.CheckIn).count()
    by_day = {}
    for day in range(1, 8):
        by_day[f"day_{day}"] = db.query(models.CheckIn).filter(models.CheckIn.conference_day == day).count()
    return {
        "total_registrants": total_registrants,
        "total_checkins": total_checkins,
        "checkins_by_day": by_day,
    }
